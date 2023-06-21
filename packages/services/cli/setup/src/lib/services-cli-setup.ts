import { ListProjectDPO } from '@migrasi/shared/entities';
import { LoadWithMessage, type TRPC } from '@migrasi/shared/trpc/clients/cli';

import { bgGreen, bgRed, dim, inverse } from 'chalk';
import inquirer from 'inquirer';
import { Command } from 'typed-cmdargs';
import { checkFolderExists } from '@migrasi/shared/utils';
import { CLIConfig } from '@migrasi/services/cli/config';
import { Config } from '@migrasi/services/cli/config';

export class Setup implements Command {
  constructor(private trpc: TRPC, private config: CLIConfig) {}

  @LoadWithMessage('Fetching your projects ...')
  private async fetchProject(): Promise<ListProjectDPO> {
    const projects = await this.trpc.project.getAllProjects.query();
    if (projects.length === 0) {
      console.log('you dont have any projects. Create one via web app');
      process.exit(0);
    }

    return projects;
  }

  private async askSelectProject(projects: ListProjectDPO) {
    const projectNames = projects.map((project) => {
      return {
        name: `${project.name} ${
          project.is_author ? dim('-- You are author here') : ''
        }`,
        value: project.id,
      };
    });

    const answer = await inquirer.prompt<{ projectId: string }>({
      name: 'projectId',
      type: 'list',
      message: 'Select your project ...',
      choices: projectNames,
    });

    const selectedProject = projects.find(
      (project) => project.id === answer.projectId
    );
    if (selectedProject === undefined) {
      console.log('you dont select any project');
      process.exit(1);
    }

    return selectedProject;
  }

  private async askMigrationFolder() {
    const answer = await inquirer.prompt<{ migrationFolder: string }>({
      name: 'migrationFolder',
      type: 'input',
      message: 'Type your migration folder, relative to your current workspace',
      default: 'packages/migrator/src/migrations/src',
    });

    const isExists = await checkFolderExists(
      `${process.cwd()}/${answer.migrationFolder}`
    );
    if (!isExists) {
      console.log(bgRed('Folder not found'));
      process.exit(1);
    }

    return answer.migrationFolder;
  }

  async execute(): Promise<void> {
    const projects = await this.fetchProject();
    const selectedProject = await this.askSelectProject(projects);
    const selectedMigrationFolder = await this.askMigrationFolder();

    const workspaceConfig: Config = {
      project: {
        id: selectedProject.id,
        slug: selectedProject.slug,
        name: selectedProject.name,
      },
      migration_folder: selectedMigrationFolder,
    };

    await this.config.writeConfig(workspaceConfig);

    console.log(
      `${bgGreen('setup completed')}. You can now try to run ${inverse(
        'migrasi create [filename]'
      )}`
    );

    process.exit(0);
  }
}
