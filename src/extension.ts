import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "flare-colorizer" is now active!');

    const disposable = vscode.commands.registerCommand('flare-colorizer.colorize', async () => {
        vscode.window.showInformationMessage('Flare-colorizer has been loaded! DATADOGS UNITE!!!');

        // Get the first workspace folder
        const workspaceFolder = vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders[0].uri.fsPath : undefined;

        if (workspaceFolder) {
            const logFilePath = path.join(workspaceFolder, 'status.log');

            // Check if the file exists
            if (fs.existsSync(logFilePath)) {
                // Read the file content
                const logContent = fs.readFileSync(logFilePath, 'utf-8');

                // Extract the agent version using regex
                const versionMatch = logContent.match(/Agent \(v(\d+\.\d+\.\d+)\)/);
                if (versionMatch) {
                    const agentVersion = versionMatch[1];
                    console.log('Agent version:', agentVersion);

                    // Fetch the release date from GitHub API
                    try {
                        const response = await axios.get(`https://api.github.com/repos/DataDog/datadog-agent/releases/tags/${agentVersion}`);
                        const releaseDate = new Date(response.data.published_at);
                        console.log(`Release date for version ${agentVersion}:`, releaseDate);

                        // Compare release date with current date
                        const currentDate = new Date();
                        const diffTime = Math.abs(currentDate.getTime() - releaseDate.getTime());
                        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);

                        let scopeName = 'string.blue';
                        if (diffMonths <= 2) {
                            scopeName = 'string.green';
                        } else if (diffMonths <= 6) {
                            scopeName = 'string.version_yellow';
                        } else {
                            scopeName = 'string.error_red';
                        }

                        console.log(`Scope for version ${agentVersion}:`, scopeName);
                        // Define the array of possible scopes

                        //THIS IS BAD! ITS CHANGING EVERYTHING THAT USES THESE COLORS. NEED BETTER LOGIC
                        const possibleScopes = [
                            'string.placeholder_version',
                            'string.error_red',
                            'string.blue',
                            'string.version_yellow',
                            'string.green'
                        ];

                        // Update the TextMate grammar file with the correct scope
                        const grammarFilePath = path.join(__dirname, '..', 'syntaxes', 'status.tmLanguage.json');
                        let grammarContent = fs.readFileSync(grammarFilePath, 'utf-8');
                        possibleScopes.forEach(scope => {
                            const regex = new RegExp(`"${scope}"`, 'g');
                            grammarContent = grammarContent.replace(regex, `"${scopeName}"`);
                        });
                        console.log('Updated grammar content:', grammarContent); // Log the updated content
                        fs.writeFileSync(grammarFilePath, grammarContent, 'utf-8');

                        // Reload the window to apply the changes
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    } catch (error) {
                        console.error('Error fetching release date from GitHub:', error);
                    }
                } else {
                    console.log('Agent version not found in status.log');
                }
            } else {
                console.log('status.log file does not exist');
            }
        } else {
            console.log('No workspace folder is open');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}