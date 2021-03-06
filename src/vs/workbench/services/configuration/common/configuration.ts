/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { URI } from 'vs/base/common/uri';
import { IDisposable } from 'vs/base/common/lifecycle';
import { Event } from 'vs/base/common/event';
import { FileChangesEvent, IFileService } from 'vs/platform/files/common/files';

export const FOLDER_CONFIG_FOLDER_NAME = '.vscode';
export const FOLDER_SETTINGS_NAME = 'settings';
export const FOLDER_SETTINGS_PATH = `${FOLDER_CONFIG_FOLDER_NAME}/${FOLDER_SETTINGS_NAME}.json`;

export const defaultSettingsSchemaId = 'vscode://schemas/settings/default';
export const userSettingsSchemaId = 'vscode://schemas/settings/user';
export const workspaceSettingsSchemaId = 'vscode://schemas/settings/workspace';
export const folderSettingsSchemaId = 'vscode://schemas/settings/folder';
export const launchSchemaId = 'vscode://schemas/launch';

export const TASKS_CONFIGURATION_KEY = 'tasks';
export const LAUNCH_CONFIGURATION_KEY = 'launch';

export const WORKSPACE_STANDALONE_CONFIGURATIONS = Object.create(null);
WORKSPACE_STANDALONE_CONFIGURATIONS[TASKS_CONFIGURATION_KEY] = `${FOLDER_CONFIG_FOLDER_NAME}/${TASKS_CONFIGURATION_KEY}.json`;
WORKSPACE_STANDALONE_CONFIGURATIONS[LAUNCH_CONFIGURATION_KEY] = `${FOLDER_CONFIG_FOLDER_NAME}/${LAUNCH_CONFIGURATION_KEY}.json`;


export type ConfigurationKey = { type: 'user' | 'workspaces' | 'folder', key: string };

export interface IConfigurationCache {

	read(key: ConfigurationKey): Promise<string>;
	write(key: ConfigurationKey, content: string): Promise<void>;
	remove(key: ConfigurationKey): Promise<void>;

}

export interface IConfigurationFileService {
	fileService: IFileService | null;
	readonly onFileChanges: Event<FileChangesEvent>;
	readonly isWatching: boolean;
	readonly whenWatchingStarted: Promise<void>;
	whenProviderRegistered(scheme: string): Promise<void>;
	watch(resource: URI): IDisposable;
	exists(resource: URI): Promise<boolean>;
	resolveContent(resource: URI): Promise<string>;
}

export class ConfigurationFileService implements IConfigurationFileService {

	constructor(public fileService: IFileService) { }

	get onFileChanges() { return this.fileService.onFileChanges; }
	readonly whenWatchingStarted: Promise<void> = Promise.resolve();
	readonly isWatching: boolean = true;

	whenProviderRegistered(scheme: string): Promise<void> {
		if (this.fileService.canHandleResource(URI.from({ scheme }))) {
			return Promise.resolve();
		}
		return new Promise((c, e) => {
			const disposable = this.fileService.onDidChangeFileSystemProviderRegistrations(e => {
				if (e.scheme === scheme && e.added) {
					disposable.dispose();
					c();
				}
			});
		});
	}

	watch(resource: URI): IDisposable {
		return this.fileService.watch(resource);
	}

	exists(resource: URI): Promise<boolean> {
		return this.fileService.exists(resource);
	}

	resolveContent(resource: URI): Promise<string> {
		return this.fileService.resolveContent(resource, { encoding: 'utf8' }).then(content => content.value);
	}

}
