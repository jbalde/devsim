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
    taskDetail: string;
    noTasksProject: string;
    noTasks: string;
    taskNotFound: string;
    backToList: string;
    titlePlaceholder: string;
    descPlaceholder: string;
    noProject: string;
    noSquad: string;
    editing: string;
    unassigned: string;
    emptyDesc: string;
    ticks: string;
    // Labels
    labelTitle: string;
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

  // --- Agent profiles ---
  agents: {
    productManager: { label: string; description: string };
    projectManager: { label: string; description: string };
    frontendDev: { label: string; description: string };
    backendDev: { label: string; description: string };
    fullstackDev: { label: string; description: string };
    biAnalyst: { label: string; description: string };
    securityEngineer: { label: string; description: string };
    qaEngineer: { label: string; description: string };
    devopsEngineer: { label: string; description: string };
    uxDesigner: { label: string; description: string };
  };

  // --- Simulation chat lines ---
  sim: {
    working: string[];
    askingHelp: string[];
    reviewing: string[];
    managing: string[];
    idleAnnounce: string;
    assignTask: string;
    ackTask: string;
    finishTask: string;
    requestReview: string;
    systemPrompt: string;
    contextAssign: string;
    contextAck: string;
    contextWorkUpdate: string;
    contextFinish: string;
    contextReviewReq: string;
    contextReviewReply: string;
    contextIdle: string;
    contextManaging: string;
  };
}
