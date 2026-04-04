import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-guard';
import { triggerPrizePoolUpdate, triggerNewDonation, triggerNewSawer } from '@/lib/pusher';

// PUT /api/payments/confirm — confirm or reject a payment
export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const { type, id, status } = body;

    // Validate required fields
    if (!type || !id || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: type, id, status' },
        { status: 400 }
      );
    }

    // Validate type
    if (type !== 'donation' && type !== 'sawer') {
      return NextResponse.json(
        { success: false, error: 'Type must be "donation" or "sawer"' },
        { status: 400 }
      );
    }

    // Validate status
    if (status !== 'confirmed' && status !== 'rejected') {
      return NextResponse.json(
        { success: false, error: 'Status must be "confirmed" or "rejected"' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      paymentStatus: status,
    };

    // Set paidAt only for confirmed payments
    if (status === 'confirmed') {
      updateData.paidAt = new Date();
    }

    if (type === 'donation') {
      // Atomically update only if still pending (prevents race condition)
      const updatedDonation = await db.donation.updateMany({
        where: { id, paymentStatus: 'pending' },
        data: updateData,
      });

      if (updatedDonation.count === 0) {
        // Already processed
        const existing = await db.donation.findUnique({ where: { id } });
        if (!existing) {
          return NextResponse.json(
            { success: false, error: 'Donation not found' },
            { status: 404 }
          );
        }
        return NextResponse.json(
          { success: false, error: `Donation already ${existing.paymentStatus || 'processed'}` },
          { status: 400 }
        );
      }

      // Fetch updated record with user info
      const donationResult = await db.donation.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      });

      // Donation confirmed — prize pool NOT updated
      // Donasi = dana penyelenggaraan liga (bukan prize pool)
      // Hanya Sawer yang otomatis menambah prize pool
      if (status === 'confirmed' && donationResult) {
        // Just broadcast confirmation via Pusher (no prize pool update)
        triggerNewDonation(undefined, {
          amount: donationResult.amount,
          userName: donationResult.user?.name || 'Anonymous',
          message: donationResult.message || undefined,
        }).catch(() => {});
      }

      return NextResponse.json({
        success: true,
        record: donationResult,
      });
    }

    // type === 'sawer'
    // Wrap sawer status update + prize pool increment in a single transaction
    // to prevent the sawer being confirmed without the prize pool being updated
    const txResult = await db.$transaction(async (tx) => {
      // Atomically update only if still pending (prevents race condition)
      const updatedSawer = await tx.sawer.updateMany({
        where: { id, paymentStatus: 'pending' },
        data: updateData,
      });

      if (updatedSawer.count === 0) {
        // Already processed — return early signal
        return { alreadyProcessed: true, sawerResult: null, updatedTournament: null, tournamentId: null };
      }

      // Fetch the updated sawer record
      const sawerResult = await tx.sawer.findUnique({
        where: { id },
      });

      // If confirmed, update tournament prize pool atomically
      let updatedTournament = null;
      let tournamentId: string | null = null;

      if (status === 'confirmed' && sawerResult) {
        // Use tournamentId from the sawer DB record (stored during creation)
        // Falls back to body.tournamentId for backward compatibility
        tournamentId = sawerResult.tournamentId || body.tournamentId;

        if (tournamentId) {
          updatedTournament = await tx.tournament.update({
            where: { id: tournamentId },
            data: {
              prizePool: {
                increment: sawerResult.amount,
              },
            },
          });
        } else {
          // No tournamentId on sawer record — find the latest active/ongoing tournament
          const tournament = await tx.tournament.findFirst({
            where: {
              status: { in: ['setup', 'registration', 'ongoing'] },
            },
            orderBy: { createdAt: 'desc' },
          });
          if (tournament) {
            tournamentId = tournament.id;
            updatedTournament = await tx.tournament.update({
              where: { id: tournament.id },
              data: {
                prizePool: {
                  increment: sawerResult.amount,
                },
              },
            });
          }
        }
      }

      return { alreadyProcessed: false, sawerResult, updatedTournament, tournamentId };
    });

    if (txResult.alreadyProcessed) {
      const existingSawer = await db.sawer.findUnique({ where: { id } });
      if (!existingSawer) {
        return NextResponse.json(
          { success: false, error: 'Sawer not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: `Sawer already ${existingSawer.paymentStatus || 'processed'}` },
        { status: 400 }
      );
    }

    const { sawerResult, updatedTournament, tournamentId } = txResult;

    // Broadcast prize pool update via Pusher (outside transaction — fire-and-forget)
    if (status === 'confirmed' && updatedTournament) {
      triggerPrizePoolUpdate({ totalPrizePool: updatedTournament.prizePool }).catch(() => {});
    }

    // Re-broadcast sawer as confirmed
    if (status === 'confirmed' && sawerResult) {
      triggerNewSawer(tournamentId, {
        ...sawerResult,
        amount: sawerResult.amount,
      }).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      record: sawerResult,
    });
  } catch (error) {
    console.error('[PAYMENTS CONFIRM]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process payment confirmation' },
      { status: 500 }
    );
  }
}
