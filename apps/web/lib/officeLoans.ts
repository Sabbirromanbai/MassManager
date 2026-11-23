import { ObjectId } from "mongodb";
import type { Member, OfficeLoan, OfficeLoanRepayment } from "./models";

export interface OfficeLoanSummary {
  loanCount: number;
  totalLoaned: number;
  totalRepaid: number;
  remainingBalance: number;
}

export interface SerializedOfficeLoanRepayment {
  id: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
}

export interface SerializedOfficeLoan {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  note: string;
  createdAt: string;
  repayments: SerializedOfficeLoanRepayment[];
  totalRepaid: number;
  remainingBalance: number;
}

/** Money is stored as a number; keep balances free of floating-point noise. */
export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function getTotalRepaid(loan: Pick<OfficeLoan, "repayments">): number {
  const repayments = loan.repayments ?? [];
  return roundMoney(
    repayments.reduce((total, repayment) => total + repayment.amount, 0)
  );
}

export function getRemainingBalance(loan: OfficeLoan): number {
  return roundMoney(loan.amount - getTotalRepaid(loan));
}

export function getOfficeLoanSummary(loans: OfficeLoan[]): OfficeLoanSummary {
  return loans.reduce<OfficeLoanSummary>(
    (summary, loan) => {
      const repaid = getTotalRepaid(loan);
      summary.loanCount += 1;
      summary.totalLoaned = roundMoney(summary.totalLoaned + loan.amount);
      summary.totalRepaid = roundMoney(summary.totalRepaid + repaid);
      summary.remainingBalance = roundMoney(summary.remainingBalance + (loan.amount - repaid));
      return summary;
    },
    { loanCount: 0, totalLoaned: 0, totalRepaid: 0, remainingBalance: 0 }
  );
}

function serializeRepayment(
  repayment: OfficeLoanRepayment
): SerializedOfficeLoanRepayment {
  return {
    id: repayment._id?.toString() ?? "",
    amount: repayment.amount,
    date: repayment.date,
    note: repayment.note ?? "",
    createdAt: repayment.createdAt.toISOString(),
  };
}

export function serializeOfficeLoan(
  loan: OfficeLoan & { _id: ObjectId }
): SerializedOfficeLoan {
  const repayments = loan.repayments ?? [];

  return {
    id: loan._id.toString(),
    memberId: loan.memberId.toString(),
    amount: loan.amount,
    date: loan.date,
    note: loan.note ?? "",
    createdAt: loan.createdAt.toISOString(),
    repayments: repayments.map(serializeRepayment),
    totalRepaid: getTotalRepaid(loan),
    remainingBalance: getRemainingBalance(loan),
  };
}

export function getMemberObjectId(member: Member): ObjectId {
  return member._id instanceof ObjectId
    ? member._id
    : new ObjectId(String(member._id));
}
