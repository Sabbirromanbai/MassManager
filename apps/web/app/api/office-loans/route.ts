import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { COLLECTIONS, OfficeLoan } from "@/lib/models";
import {
  createOfficeLoanSchema,
  deleteOfficeLoanSchema,
  updateOfficeLoanSchema,
} from "@/lib/schemas";
import {
  getOfficeLoanSummary,
  getMemberObjectId,
  getTotalRepaid,
  serializeOfficeLoan,
} from "@/lib/officeLoans";
import {
  managerAuthErrorResponse,
  requireCurrentManager,
} from "@/lib/officeLoanAuth";

async function readJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function invalidRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Manager-only. Returns the current manager's loans with their balances; no member data is exposed. */
export async function GET() {
  try {
    const authResult = await requireCurrentManager();
    if (authResult.status !== "ok") return managerAuthErrorResponse(authResult);

    const db = await getDb();
    const loans = await db
      .collection<OfficeLoan>(COLLECTIONS.officeLoans)
      .find({ memberId: getMemberObjectId(authResult.member) })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      loans: loans.map((loan) => serializeOfficeLoan(loan)),
      summary: getOfficeLoanSummary(loans),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to load office loans" },
      { status: 500 }
    );
  }
}

/** Manager-only. Creates a loan owned by the current manager's member ID. */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentManager();
    if (authResult.status !== "ok") return managerAuthErrorResponse(authResult);

    const validation = createOfficeLoanSchema.safeParse(await readJson(request));
    if (!validation.success) {
      return invalidRequest(
        validation.error.issues[0]?.message ?? "Invalid request"
      );
    }

    const { amount, date, note } = validation.data;
    const db = await getDb();
    const result = await db
      .collection<OfficeLoan>(COLLECTIONS.officeLoans)
      .insertOne({
        memberId: getMemberObjectId(authResult.member),
        amount,
        date,
        note: note ?? "",
        repayments: [],
        createdAt: new Date(),
      });

    return NextResponse.json({ success: true, id: result.insertedId.toString() });
  } catch {
    return NextResponse.json(
      { error: "Failed to create office loan" },
      { status: 500 }
    );
  }
}

/** Manager-only. Edits a loan; cannot reduce it below what has been repaid. */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireCurrentManager();
    if (authResult.status !== "ok") return managerAuthErrorResponse(authResult);

    const validation = updateOfficeLoanSchema.safeParse(await readJson(request));
    if (!validation.success) {
      return invalidRequest(
        validation.error.issues[0]?.message ?? "Invalid request"
      );
    }

    const { id, amount, date, note } = validation.data;
    const db = await getDb();
    const loans = db.collection<OfficeLoan>(COLLECTIONS.officeLoans);
    const ownedLoan = {
      _id: new ObjectId(id),
      memberId: getMemberObjectId(authResult.member),
    };

    const existing = await loans.findOne(ownedLoan);
    if (!existing) {
      return NextResponse.json({ error: "Office loan not found" }, { status: 404 });
    }

    if (amount !== undefined && amount < getTotalRepaid(existing)) {
      return invalidRequest("Amount cannot be less than total repayments");
    }

    const update: Partial<OfficeLoan> = {};
    if (amount !== undefined) update.amount = amount;
    if (date !== undefined) update.date = date;
    if (note !== undefined) update.note = note;

    const updateFilter =
      amount === undefined
        ? ownedLoan
        : {
            ...ownedLoan,
            $expr: {
              $gte: ["$amount", { $sum: "$repayments.amount" }],
            },
          };

    const updateResult = await loans.updateOne(updateFilter, { $set: update });
    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: "Loan balance changed; please retry" },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update office loan" },
      { status: 500 }
    );
  }
}

/** Manager-only. Deletes a loan and its repayment history. */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireCurrentManager();
    if (authResult.status !== "ok") return managerAuthErrorResponse(authResult);

    const validation = deleteOfficeLoanSchema.safeParse(await readJson(request));
    if (!validation.success) {
      return invalidRequest(
        validation.error.issues[0]?.message ?? "Invalid request"
      );
    }

    const db = await getDb();
    const result = await db
      .collection<OfficeLoan>(COLLECTIONS.officeLoans)
      .deleteOne({
        _id: new ObjectId(validation.data.id),
        memberId: getMemberObjectId(authResult.member),
      });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Office loan not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete office loan" },
      { status: 500 }
    );
  }
}
