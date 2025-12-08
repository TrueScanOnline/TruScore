// App Initialization Manager
// Provides systematic, coordinated initialization of all app services
// Replaces uncoordinated .then() chains and setTimeout patches

import { logger } from '../utils/logger';

export interface InitializationTask {
  name: string;
  task: () => Promise<void>;
  dependencies?: string[]; // Names of tasks that must complete first
  critical: boolean; // If true, failure blocks initialization
  retries?: number; // Number of retry attempts
}

export interface InitializationResult {
  success: boolean;
  taskName: string;
  error?: Error;
  duration: number;
}

class AppInitializationManager {
  private tasks: Map<string, InitializationTask> = new Map();
  private results: Map<string, InitializationResult> = new Map();
  private isInitializing = false;

  /**
   * Register an initialization task
   */
  registerTask(task: InitializationTask): void {
    this.tasks.set(task.name, task);
  }

  /**
   * Register multiple tasks at once
   */
  registerTasks(tasks: InitializationTask[]): void {
    tasks.forEach(task => this.registerTask(task));
  }

  /**
   * Get all tasks in dependency order (topological sort)
   */
  private getTasksInOrder(): InitializationTask[] {
    const ordered: InitializationTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskName: string) => {
      if (visiting.has(taskName)) {
        throw new Error(`Circular dependency detected involving task: ${taskName}`);
      }
      if (visited.has(taskName)) {
        return;
      }

      visiting.add(taskName);
      const task = this.tasks.get(taskName);
      if (!task) {
        throw new Error(`Task not found: ${taskName}`);
      }

      // Visit dependencies first
      if (task.dependencies) {
        task.dependencies.forEach(dep => visit(dep));
      }

      visiting.delete(taskName);
      visited.add(taskName);
      ordered.push(task);
    };

    this.tasks.forEach((_, name) => visit(name));
    return ordered;
  }

  /**
   * Execute a single task with retry logic
   */
  private async executeTask(task: InitializationTask): Promise<InitializationResult> {
    const startTime = Date.now();
    const maxRetries = task.retries ?? 0;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await task.task();
        const duration = Date.now() - startTime;
        logger.debug(`✅ Initialized: ${task.name} (${duration}ms)`);
        return {
          success: true,
          taskName: task.name,
          duration,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < maxRetries) {
          logger.debug(`⚠️ ${task.name} failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying...`, lastError.message);
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
        } else {
          logger.error(`❌ Failed to initialize: ${task.name}`, lastError);
        }
      }
    }

    const duration = Date.now() - startTime;
    return {
      success: false,
      taskName: task.name,
      error: lastError || new Error('Unknown error'),
      duration,
    };
  }

  /**
   * Initialize all registered tasks in dependency order
   */
  async initialize(): Promise<Map<string, InitializationResult>> {
    if (this.isInitializing) {
      throw new Error('Initialization already in progress');
    }

    this.isInitializing = true;
    this.results.clear();

    try {
      const orderedTasks = this.getTasksInOrder();
      logger.info(`🚀 Starting app initialization (${orderedTasks.length} tasks)`);

      // Execute tasks sequentially (respecting dependencies)
      // Critical tasks block, non-critical tasks continue on failure
      for (const task of orderedTasks) {
        // Check if dependencies succeeded
        if (task.dependencies) {
          const failedDependencies = task.dependencies.filter(
            dep => !this.results.get(dep)?.success
          );
          
          if (failedDependencies.length > 0) {
            logger.warn(`⏭️ Skipping ${task.name} - dependencies failed: ${failedDependencies.join(', ')}`);
            this.results.set(task.name, {
              success: false,
              taskName: task.name,
              error: new Error(`Dependencies failed: ${failedDependencies.join(', ')}`),
              duration: 0,
            });
            continue;
          }
        }

        const result = await this.executeTask(task);
        this.results.set(task.name, result);

        // If critical task failed, stop initialization
        if (!result.success && task.critical) {
          logger.error(`🛑 Critical task failed: ${task.name} - stopping initialization`);
          break;
        }
      }

      const successful = Array.from(this.results.values()).filter(r => r.success).length;
      const failed = Array.from(this.results.values()).filter(r => !r.success).length;
      
      logger.info(`✅ Initialization complete: ${successful} succeeded, ${failed} failed`);

      return this.results;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Get initialization results
   */
  getResults(): Map<string, InitializationResult> {
    return new Map(this.results);
  }

  /**
   * Check if initialization was successful
   */
  isSuccessful(): boolean {
    return Array.from(this.results.values()).every(
      result => result.success || !this.tasks.get(result.taskName)?.critical
    );
  }

  /**
   * Reset manager (for testing)
   */
  reset(): void {
    this.tasks.clear();
    this.results.clear();
    this.isInitializing = false;
  }
}

// Singleton instance
export const appInitializationManager = new AppInitializationManager();
