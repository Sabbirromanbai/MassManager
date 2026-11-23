import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { COLLECTIONS, OfficeLoan, OfficeLoanRepayment } from "@/lib/models";
import {
  createOfficeLoanRepaymentSchema,
  deleteOfficeLoanRepaymentSchema,
} from "@/lib/schemas";
import { getMemberObjectId, getRemainingBalance } from "@/lib/officeLoans";
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

/** Manager-only. Records a repayment and returns the new remaining balance. */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireCurrentManager();
    if (authResult.status !== "ok") return managerAuthErrorResponse(authResult);

    const validation = createOfficeLoanRepaymentSchema.safeParse(
      await readJson(request)
    );
    if (!validation.success) {
      return invalidRequest(
        validation.error.issues[0]?.message ?? "Invalid request"
      );
    }

    const { loanId, amount, date, note } = validation.data;
    const db = await getDb();
    const loans = db.collection<OfficeLoan>(COLLECTIONS.officeLoans);
    const managerId = getMemberObjectId(authResult.member);
    const existing = await loans.findOne({
      _id: new ObjectId(loanId),
      memberId: managerId,
    });
    if (!existing) {
      return NextResponse.json({ error: "Office loan not found" }, { status: 404 });
    }

    const remaining = getRemainingBalance(existing);
    if (amount > remaining) {
      return invalidRequest("Repayment exceeds the remaining balance");
    }

    const repayment: OfficeLoanRepayment = {
      _id: new ObjectId(),
      amount,
      date,
      note: note ?? "",
      createdAt: new Date(),
    };

    const updatedLoan = await loans.findOneAndUpdate(
      {
        _id: existing._id,
        memberId: managerId,
        $expr: {
          $lte: [
            { $subtract: ["$amount", { $sum: "$repayments.amount" }] },
            amount,
          ],
        },
      },
      { $push: { repayments: repayment } },
      { returnDocument: "after" }
    );

    if (!updatedLoan) {
      return NextResponse.json(
        { error: "Loan balance changed; please retry" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      repaymentId: repayment._id!.toString(),
      remainingBalance: getRemainingBalance(updatedLoan),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to record repayment" },
      { status: 500 }
    );
  }
}

/** Manager-only. Removes a repayment (correction) and returns the new balance. */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireCurrentManager();
    if (authResult.status !== "ok") return managerAuthErrorResponse(authResult);

    const validation = deleteOfficeLoanRepaymentSchema.safeParse(
      await readJson(request)
    );
    if (!validation.success) {
      return invalidRequest(
        validation.error.issues[0]?.message ?? "Invalid request"
      );
    }

    const { loanId, repaymentId } = validation.data;
    const db = await getDb();
    const loans = db.collection<OfficeLoan>(COLLECTIONS.officeLoans);
    const managerId = getMemberObjectId(authResult.member);
    const existing = await loans.findOne({
      _id: new ObjectId(loanId),
      memberId: managerId,
    });
    if (!existing) {
      return NextResponse.json({ error: "Office loan not found" }, { status: 404 });
    }

    const repaymentObjectId = new ObjectId(repaymentId);
    const updatedLoan = await loans.findOneAndUpdate(
      {
        _id: existing._id,
        memberId: managerId,
        "repayments._id": repaymentObjectId,
      },
      { $pull: { repayments: { _id: repaymentObjectId } } },
      { returnDocument: "after" }
    );
    if (!updatedLoan) {
      return NextResponse.json(
        { error: "Repayment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      remainingBalance: getRemainingBalance(updatedLoan),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to remove repayment" },
      { status: 500 }
    );
  }
}
