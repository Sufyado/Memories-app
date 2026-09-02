import type { TranslationSchema } from './en';

export const ar: TranslationSchema = {
  appName: 'فيستوريا',
  tabs: {
    home: 'الرئيسية',
    library: 'المكتبة',
    search: 'بحث',
    create: 'إنشاء',
    profile: 'الملف الشخصي',
  },
  home: {
    title: 'الرئيسية',
    recentStories: 'أحدث القصص',
    collections: 'المجموعات',
    emptyTitle: 'أرشيفك فارغ',
    emptySubtitle: 'التقط ذكرى أو وثّق إجراءً للبدء.',
  },
  library: {
    title: 'المكتبة',
    grid: 'شبكة',
    list: 'قائمة',
    emptyTitle: 'لا يوجد شيء هنا بعد',
    emptySubtitle: 'ستظهر هنا المجلدات والقصص التي تنشئها.',
  },
  search: {
    title: 'بحث',
    placeholder: 'ابحث في القصص والوسوم والملاحظات…',
    emptyTitle: 'ابحث في أرشيفك',
    emptySubtitle: 'اعثر على القصص عبر العنوان أو الوسم أو المجلد أو نص الشرائح.',
  },
  create: {
    title: 'إنشاء',
    newStory: 'قصة جديدة',
    newStorySubtitle: 'التقط صورًا وفيديوهات وملاحظات كشرائح',
    newFolder: 'مجلد جديد',
    newFolderSubtitle: 'نظّم القصص ضمن مجموعة',
  },
  profile: {
    title: 'الملف الشخصي',
    account: 'الحساب',
    language: 'اللغة',
    appearance: 'المظهر',
    signOut: 'تسجيل الخروج',
    signIn: 'تسجيل الدخول',
    notSignedIn: 'لم يتم تسجيل الدخول',
  },
  common: {
    cancel: 'إلغاء',
    save: 'حفظ',
    comingSoon: 'قريبًا',
  },
};
