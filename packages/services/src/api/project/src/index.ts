import { db } from '@migrasi/shared/database';
import { ProjectRepository } from './impl/project.repository';
import { ProjectValidator } from './impl/project.validator';
import { ProjectService } from './impl/project.service';
import { emailBridge } from '@migrasi/shared/bridges/email';

const projectRepo = new ProjectRepository(db);
const projectValidator = new ProjectValidator(projectRepo);
const projectService = new ProjectService(
  projectRepo,
  projectValidator,
  emailBridge
);

export { projectService };
export * from './project.interface';
