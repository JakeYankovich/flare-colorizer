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
            const logFilePaths = [
                path.join(workspaceFolder, 'status.log'),
                path.join(workspaceFolder, 'cluster-agent-status.log')
            ];

            // Check if any of the files exist
            const logFilePath = logFilePaths.find(fs.existsSync);

            if (logFilePath) {
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

                        let color = '#ff4444'; // Default to red
                        if (diffMonths <= 2) {
                            color = '#77ffbb'; // Green
                        } else if (diffMonths <= 6) {
                            color = '#ffff00'; // Yellow
                        }

                        console.log(`Color for version ${agentVersion}:`, color);

                        // Update the flare-theme.json file with the correct color
                        const themeFilePath = path.join(__dirname, '..', 'themes', 'flare-theme.json');
                        let themeContent = fs.readFileSync(themeFilePath, 'utf-8');
                        let themeJson = JSON.parse(themeContent);

                        // Update the color for the version scope
                        themeJson.tokenColors.forEach((token: any) => {
                            if (token.scope === 'string.version_color') {
                                token.settings.foreground = color;
                            }
                        });

                        // Convert JSON back to string
                        themeContent = JSON.stringify(themeJson, null, 2);
                        fs.writeFileSync(themeFilePath, themeContent, 'utf-8');

                        // Reload the window to apply the changes
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    } catch (error) {
                        console.error('Error fetching release date from GitHub:', error);
                    }
                } else {
                    console.log('Agent version not found in log file');
                }
            } else {
                console.log('No log file (status.log or cluster-agent-status.log) found');
            }
        } else {
            console.log('No workspace folder is open');
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {
}