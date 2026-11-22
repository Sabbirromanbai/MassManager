import { getDashboardMembersWithMeals } from "@/lib/stats";
import { getManagerRotationIndex } from "@/lib/manager";
async function main() {
  const members = await getDashboardMembersWithMeals("2027-01");
  for (const m of members) {
    console.log(m.name, "rotationOrder=", m.rotationOrder, "type=", m.type, "isMgr=", m.rotationOrder !== null && m.rotationOrder === getManagerRotationIndex("2027-01"));
  }
}
main();
