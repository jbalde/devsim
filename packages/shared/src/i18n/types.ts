/** Supported locales */
export const Locale = {
  EN: 'en',
  ES: 'es',
} as const;

export type Locale = (typeof Locale)[keyof typeof Locale];

/** Full translation dictionary shape */
export interface Translations {
  // --- Common ---
  common: {
    save: string;
    cancel: string;
    create: string;
    edit: string;
    delete: string;
    close: string;
    loading: string;
    none: string;
    back: string;
    yes: string;
    no: string;
    enabled: string;
    disabled: string;
  };

  // --- TopBar ---
  topBar: {
    title: string;
    budget: string;
    tick: string;
    team: string;
    tokens: string;
    llm: string;
    projects: string;
    hire: string;
    tasks: string;
    autolayout: string;
    addSquad: string;
    play: string;
    pause: string;
    squadNamePrompt: string;
  };

  // --- TaskPanel ---
  task: {
    title: string;
    newTask: string;
    newEpic: string;
    taskDetail: string;
    noTasksProject: string;
    noTasks: string;
    taskNotFound: string;
    backToList: string;
    titlePlaceholder: string;
    descPlaceholder: string;
    noEpic: string;
    noProject: string;
    noSquad: string;
    editing: string;
    unassigned: string;
    emptyDesc: string;
    ticks: string;
    // Labels
    labelTitle: string;
    labelType: string;
    labelEpic: string;
    labelStatus: string;
    labelPriority: string;
    labelDescription: string;
    labelProject: string;
    labelSquad: string;
    labelAssignee: string;
    labelProgress: string;
    labelCreated: string;
    labelCompleted: string;
    // Status
    statusBacklog: string;
    statusTodo: string;
    statusInProgress: string;
    statusInReview: string;
    statusDone: string;
    typeEpic: string;
    typeTask: string;
    // Priority
    priorityLow: string;
    priorityMedium: string;
    priorityHigh: string;
    priorityCritical: string;
  };

  // --- ChatLog ---
  chat: {
    title: string;
    filtered: string;
    filters: string;
    clearChat: string;
    clearFilters: string;
    allSquads: string;
    allAgents: string;
    noMessagesFilter: string;
    noMessages: string;
  };

  // --- HirePanel ---
  hire: {
    title: string;
    costPerTick: string;
  };

  // --- SquadTable ---
  squad: {
    member: string;
    members: string;
    addHint: string;
    removeMember: string;
    deleteSquad: string;
  };

  // --- Office ---
  office: {
    emptyState: string;
    addToSquad: string;
    fire: string;
  };

  // --- LlmPanel ---
  llm: {
    title: string;
    addProvider: string;
    testAll: string;
    testing: string;
    test: string;
    on: string;
    off: string;
    del: string;
    editProvider: string;
    newProvider: string;
    namePlaceholder: string;
    baseUrlPlaceholder: string;
    modelPlaceholder: string;
    apiKeyPlaceholder: string;
    emptyState: string;
    // Provider types
    typeOllama: string;
    typeLmStudio: string;
    typeOpenai: string;
    typeCustom: string;
  };

  // --- ProjectPanel ---
  project: {
    title: string;
    newProject: string;
    editProject: string;
    namePlaceholder: string;
    descPlaceholder: string;
    folders: string;
    addFolder: string;
    labelPlaceholder: string;
    pathPlaceholder: string;
    emptyState: string;
    taskCount: string;
    tasksCount: string;
    more: string;
    less: string;
    nMore: string;
    // Folder types
    folderFrontend: string;
    folderBackend: string;
    folderDocs: string;
    folderConfig: string;
    folderOther: string;
  };

  // --- Simulation chat lines and fallback copy ---
  sim: {
    working: string[];
    askingHelp: string[];
    reviewing: string[];
    managing: string[];
    llmStartBlocked: string;
    llmStartUsingProviders: string;
    idleAnnounce: string;
    assignTask: string;
    ackTask: string;
    finishTask: string;
    requestReview: string;
    // Context strings for PM/PjM prompts
    ctxProjects: string;
    ctxTeam: string;
    ctxTasks: string;
    ctxTasksInProgress: string;
    ctxNoTasksIdleWorkers: string;
    ctxUnassignedTasks: string;
    ctxTasksInProgressCount: string;
    ctxNoWorkersYet: string;
    // Epic breakdown context
    ctxEpicAnnounceContext: string;
    ctxEpicAnnounceFallback: string;
    epicFallbackScopeTitle: string;
    epicFallbackScopeDesc: string;
    epicFallbackValidationTitle: string;
    epicFallbackValidationDesc: string;
    epicFallbackMetricsTitle: string;
    epicFallbackMetricsDesc: string;
    // PM → PjM task proposal flow
    pmProposalContext: string;
    pmProposalFallback: string;
    pmProposalAnnounce: string;
    pjmCreatedTasks: string;
    pjmCreatedTasksFallback: string;
  };
}
