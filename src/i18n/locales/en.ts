export const en = {
  common: {
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    loading: "Loading...",
    add: "Add",
    remove: "Remove",
    confirm: "Confirm",
  },
  sidebar: {
    dashboard: "Dashboard",
    groups: "Groups",
    authors: "Authors",
    browse: "Browse",
    posts: "Posts",
    tasks: "Tasks",
    settings: "Settings",
    nsfw: "NSFW",
    sfw: "SFW",
    themeMode: "{{theme}} mode",
    language: "中文 / English",
  },
  dashboard: {
    stats: {
      groups: "Groups",
      authors: "Authors",
      posts: "Posts",
      mediaFiles: "Media Files",
    },
    topAuthors: "Top Authors",
    period: { "1d": "24H", "1w": "7D", "1m": "30D", all: "All" },
    noDataForPeriod: "No data for this period",
    latestMedia: "Latest Media",
    storage: "Storage",
    videoBadge: "VIDEO",
    postsMediaShort: "{{posts}}p / {{media}}m",
  },
  pages: {
    dashboard: {
      title: "Dashboard",
    },
    authors: {
      title: "Authors",
      addAuthor: "+ Add Author",
    },
    groups: {
      title: "Groups",
      newGroup: "+ New Group",
    },
    browse: {
      title: "Browse",
    },
    posts: {
      title: "Posts",
      totalCount: "{{count}} posts",
      emptyState: "No posts found.",
    },
    tasks: {
      title: "Tasks",
    },
    settings: {
      title: "Settings",
    },
  },
} as const;
