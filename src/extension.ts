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

                        let scopeName = 'string.version_placeholder';
                        if (diffMonths <= 2) {
                            scopeName = 'string.version_green';
                        } else if (diffMonths <= 6) {
                            scopeName = 'string.version_yellow';
                        } else {
                            scopeName = 'string.version_red';
                        }

                        console.log(`Scope for version ${agentVersion}:`, scopeName);
                        // Define the array of possible scopes

                        const possibleScopes = [
                            'string.version_placeholder',
                            'string.version_red',
                            'string.version_yellow',
                            'string.version_green'
                        ];

                        // Update the TextMate grammar file with the correct scope for capture group 2
                        const grammarFilePath = path.join(__dirname, '..', 'syntaxes', 'status.tmLanguage.json');
                        let grammarContent = fs.readFileSync(grammarFilePath, 'utf-8');
                        let grammarJson = JSON.parse(grammarContent);

                        // Iterate through all patterns and captures
                        grammarJson.patterns.forEach((pattern: any) => {
                            if (pattern.captures) {
                                Object.keys(pattern.captures).forEach((captureGroup) => {
                                    const capture = pattern.captures[captureGroup];
                                    if (possibleScopes.includes(capture.name)) {
                                        capture.name = scopeName;
                                    }
                                });
                            }
                        });

                        // Convert JSON back to string
                        grammarContent = JSON.stringify(grammarJson, null, 2);
                        // console.log('Updated grammar content:', grammarContent); // Log the updated content
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