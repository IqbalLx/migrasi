import { ListProjectDPO } from '@migrasi/shared/entities';
import { LoadWithMessage, type TRPC } from '@migrasi/shared/trpc/clients/cli';

import { bgGreen, dim, inverse } from 'chalk';
import inquirer from 'inquirer';
import { Command } from 'typed-cmdargs';
import { writeFile } from 'fs/promises';
import { stringify } from 'yaml';

export class Setup implements Command {
  private CONFIG_NAME = 'migrasi.yaml';
  constructor(private trpc: TRPC) {}

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

  async execute(): Promise<void> {
    const projects = await this.fetchProject();
    const selectedProject = await this.askSelectProject(projects);

    const WORKSPACE_CONFIG_PATH = `${process.cwd()}/${this.CONFIG_NAME}`;
    await writeFile(
      WORKSPACE_CONFIG_PATH,
      stringify({
        id: selectedProject.id,
        slug: selectedProject.slug,
        name: selectedProject.name,
      })
    );

    console.log(
      `${bgGreen('setup completed')}. You can now try to run ${inverse(
        'migrasi create [filename]'
      )}`
    );

    process.exit(0);
  }
}
