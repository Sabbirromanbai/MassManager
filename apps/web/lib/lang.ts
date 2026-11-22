export type Lang = "bn" | "en";

export const dict: Record<Lang, Record<string, unknown>> = {
  bn: {
    nav: {
      dashboard: "ড্যাশবোর্ড",
      mealBoard: "মিল বোর্ড",
      dailyBazar: "দৈনিক বাজার",
      advance: "এডভান্স",
      monthlyHisab: "মাসিক হিসাব",
      members: "সদস্যরা",
      overview: "ওভারভিউ",
      dailyWork: "দৈনিক কাজ",
      money: "আর্থিক",
      people: "জন",
    },
    summary: {
      totalBazar: "মোট বাজার",
      totalAdvance: "মোট এডভান্স",
      cashInHand: "হাতের টাকা",
      totalMeal: "মোট মিল",
      mealRate: "মিল রেট",
    },
    quickActions: {
      title: "দ্রুত কাজ",
      addMealEntry: "মিল এন্ট্রি যোগ করুন",
      addBazar: "বাজার যোগ করুন",
      addAdvance: "এডভান্স যোগ করুন",
      mealOffRequest: "মিল অফ অনুরোধ",
    },
    buttons: {
      signIn: "সাইন ইন",
      signUp: "সাইন আপ",
      signOut: "সাইন আউট",
      backToDashboard: "ড্যাশবোর্ডে ফিরুন",
      submit: "জমা দিন",
      creatingAccount: "অ্যাকাউন্ট তৈরি হচ্ছে...",
      signingIn: "সাইন ইন হচ্ছে...",
    },
    badges: {
      manager: "ম্যানেজার",
      member: "সদস্য",
      regular: "নিয়মিত",
      eggOnly: "শুধু ডিম",
      guest: "অতিথি",
    },
    pages: {
      dashboard: {
        title: "ড্যাশবোর্ড",
        subtitle: "ওভারভিউ {month} • ম্যানেজার: {managerName}",
        welcome: "মেস ম্যানেজার ড্যাশবোর্ডে স্বাগতম।",
        currentRole: "বর্তমান ভূমিকা: {role}",
        thisMonthManager: "এই মাসের ম্যানেজার: {managerName}",
        ourMembers: "আমাদের সদস্যরা",
        mealsThisMonth: "{count} মিল এই মাসে",
        mealOverview: "মিল ওভারভিউ",
        financialSummary: "আর্থিক সারসংক্ষেপ",
      },
      mealBoard: {
        title: "মিল বোর্ড",
        subtitle: "দৈনিক মিল এন্ট্রি এবং মিল অফ অনুরোধ",
        comingSoon: "শীঘ্রই আসছে",
        description: "মিল বোর্ড ফাংশনালিটি এখানে যোগ করা হবে।",
      },
      bazar: {
        title: "দৈনিক বাজার",
        subtitle: "দৈনিক বাজার খরচ রেকর্ড করুন",
        comingSoon: "শীঘ্রই আসছে",
        description: "দৈনিক বাজার এন্ট্রি ফাংশনালিটি এখানে যোগ করা হবে।",
      },
      advance: {
        title: "এডভান্স",
        subtitle: "সদস্যদের এডভান্স পরিচালনা করুন",
        comingSoon: "শীঘ্রই আসছে",
        description: "এডভান্স ম্যানেজমেন্ট ফাংশনালিটি এখানে যোগ করা হবে।",
      },
      monthly: {
        title: "মাসিক হিসাব",
        subtitle: "মাসিক সেটলমেন্ট এবং রিপোর্ট",
        comingSoon: "শীঘ্রই আসছে",
        description: "মাসিক হিসাব ফাংশনালিটি এখানে যোগ করা হবে।",
      },
      members: {
        title: "সদস্যরা",
        subtitle: "মেস সদস্যদের পরিচালনা করুন",
        comingSoon: "শীঘ্রই আসছে",
        description: "সদস্য ম্যানেজমেন্ট ফাংশনালিটি এখানে যোগ করা হবে।",
      },
      signIn: {
        title: "সাইন ইন",
        emailLabel: "ইমেইল",
        passwordLabel: "পাসওয়ার্ড",
        noAccount: "অ্যাকাউন্ট নেই? ",
        signUpLink: "সাইন আপ",
        failed: "সাইন ইন ব্যর্থ হয়েছে",
      },
      signUp: {
        title: "অ্যাকাউন্ট তৈরি করুন",
        nameLabel: "নাম",
        emailLabel: "ইমেইল",
        passwordLabel: "পাসওয়ার্ড",
        hasAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে? ",
        signInLink: "সাইন ইন",
        failed: "সাইন আপ ব্যর্থ হয়েছে",
      },
    },
    auth: {
      name: "নাম",
      email: "ইমেইল",
      password: "পাসওয়ার্ড",
    },
    common: {
      overviewFor: "ওভারভিউ",
      manager: "ম্যানেজার",
      noDataYet: "এখনও ডেটা নেই",
      mealEntriesWillAppear: "মিল এন্ট্রিগুলো এখানে দেখাবে",
      bazarEntriesWillAppear: "বাজার এন্ট্রিগুলো এখানে দেখাবে",
    },
  },
  en: {
    nav: {
      dashboard: "Dashboard",
      mealBoard: "Meal Board",
      dailyBazar: "Daily Bazar",
      advance: "Advance",
      monthlyHisab: "Monthly Hisab",
      members: "Members",
      overview: "Overview",
      dailyWork: "Daily Work",
      money: "Money",
      people: "People",
    },
    summary: {
      totalBazar: "Total Bazar",
      totalAdvance: "Total Advance",
      cashInHand: "Cash in Hand",
      totalMeal: "Total Meals",
      mealRate: "Meal Rate",
    },
    quickActions: {
      title: "Quick Actions",
      addMealEntry: "Add Meal Entry",
      addBazar: "Add Bazar",
      addAdvance: "Add Advance",
      mealOffRequest: "Meal Off Request",
    },
    buttons: {
      signIn: "Sign In",
      signUp: "Sign Up",
      signOut: "Sign Out",
      backToDashboard: "Back to Dashboard",
      submit: "Submit",
      creatingAccount: "Creating account...",
      signingIn: "Signing in...",
    },
    badges: {
      manager: "Manager",
      member: "Member",
      regular: "Regular",
      eggOnly: "Egg Only",
      guest: "Guest",
    },
    pages: {
      dashboard: {
        title: "Dashboard",
        subtitle: "Overview for {month} • Manager: {managerName}",
        welcome: "Welcome to the Mess Manager dashboard.",
        currentRole: "Current role: {role}",
        thisMonthManager: "This month's manager: {managerName}",
        ourMembers: "Our Members",
        mealsThisMonth: "{count} meals this month",
        mealOverview: "Meal Overview",
        financialSummary: "Financial Summary",
      },
      mealBoard: {
        title: "Meal Board",
        subtitle: "Daily meal entry and meal off requests",
        comingSoon: "Coming Soon",
        description: "Meal board functionality will be implemented here.",
      },
      bazar: {
        title: "Daily Bazar",
        subtitle: "Record daily bazar expenses",
        comingSoon: "Coming Soon",
        description: "Daily bazar entry functionality will be implemented here.",
      },
      advance: {
        title: "Advance",
        subtitle: "Manage member advances",
        comingSoon: "Coming Soon",
        description: "Advance management functionality will be implemented here.",
      },
      monthly: {
        title: "Monthly Hisab",
        subtitle: "Monthly settlement and reports",
        comingSoon: "Coming Soon",
        description: "Monthly hisab functionality will be implemented here.",
      },
      members: {
        title: "Members",
        subtitle: "Manage mess members",
        comingSoon: "Coming Soon",
        description: "Member management functionality will be implemented here.",
      },
      signIn: {
        title: "Sign In",
        emailLabel: "Email",
        passwordLabel: "Password",
        noAccount: "Don't have an account? ",
        signUpLink: "Sign Up",
        failed: "Sign in failed",
      },
      signUp: {
        title: "Create Account",
        nameLabel: "Name",
        emailLabel: "Email",
        passwordLabel: "Password",
        hasAccount: "Already have an account? ",
        signInLink: "Sign In",
        failed: "Sign up failed",
      },
    },
    auth: {
      name: "Name",
      email: "Email",
      password: "Password",
    },
    common: {
      overviewFor: "Overview for",
      manager: "Manager",
      noDataYet: "No data yet",
      mealEntriesWillAppear: "Meal entries will appear here",
      bazarEntriesWillAppear: "Bazar entries will appear here",
    },
  },
};

export function t(lang: Lang, key: string): string {
  const keys = key.split(".");
  let value: unknown = dict[lang];
  for (const k of keys) {
    if (value && typeof value === "object" && k in value) {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }
  return typeof value === "string" ? value : key;
}