import type { InjectionKey } from 'vue';

import type { TaskListPageContext } from './useTaskListPage';

export const taskListPageKey: InjectionKey<TaskListPageContext> = Symbol('task-list-page');
