import { Plugin, PluginSettingTab, App, Setting, MarkdownView, TFile } from 'obsidian';

/**
 * Settings for the Work Log plugin
 */
class WorkLogSettings {
	targetFiles: string[] = []; // Array of file paths
	worklogTag = "#worklog"; // default worklog file tag
	autoAddDate = true; // Auto-add date feature toggle
	dateFormat = "dddd YYYY-MM-DD"; // Default date format
	defaultWorklogFilename = 'worklog.md'; // case-insensitive
}

class WorkLogSettingsTab extends PluginSettingTab {
	plugin: WorkLogPlugin;

	constructor(app: App, plugin: WorkLogPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Worklog Settings'});

		new Setting(containerEl)
			.setName('Auto-add Date')
			.setDesc('Automatically add today\'s date when opening a worklog file')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoAddDate)
				.onChange(async (value) => {
					this.plugin.settings.autoAddDate = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Date Format')
			.setDesc('Format for date headers. Use: YYYY (year), MM (month), DD (day), dddd (day name)')
			.addText(text => text
				.setValue(this.plugin.settings.dateFormat)
				.onChange(async (value) => {
					this.plugin.settings.dateFormat = value;
					await this.plugin.saveSettings();
				}));

		const formatHelp = containerEl.createEl('div', { cls: 'setting-item-description' });
		formatHelp.innerHTML = 'Examples:<br>' +
			'• <code>dddd DD-MM-YYYY</code> → Monday 01-05-2023<br>' +
			'• <code>YYYY-MM-DD dddd</code> → 2023-05-01 Monday<br>' +
			'• <code>MM/DD/YYYY</code> → 05/01/2023<br>' +
			'The plugin will detect dates in your chosen format.';

		new Setting(containerEl)
			.setName('Worklog Tag')
			.setDesc('Files with this tag will be treated as work logs')
			.addText(text => text
				.setValue(this.plugin.settings.worklogTag)
				.onChange(async (value) => {
					this.plugin.settings.worklogTag = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Target Files')
			.setDesc('Files to be treated as work logs (one path per line)')
			.addTextArea(text => text
				.setValue(this.plugin.settings.targetFiles.join('\n'))
				.onChange(async (value) => {
					this.plugin.settings.targetFiles = value.split('\n')
						.map(file => file.trim())
						.filter(file => file.length > 0);
					await this.plugin.saveSettings();
				}));
	}
}

/**
 * Main plugin class for worklog functionality
 */
export default class WorkLogPlugin extends Plugin {
	settings: WorkLogSettings;

	/**
	 * Loads the plugin and initializes settings, commands, and event handlers
	 * @returns {Promise<void>}
	 */
	async onload(): Promise<void> {
		console.log('Loading worklog plugin');

		try {
			// Load settings
			this.settings = Object.assign(new WorkLogSettings(), await this.loadData());

			// Add settings tab
			this.addSettingTab(new WorkLogSettingsTab(this.app, this));

			// Register commands
			this.registerCommands();

			// Register events
			this.registerEvents();
		} catch (error) {
			console.error("Error loading worklog plugin:", error);
		}
	}

	/**
	 * Registers plugin commands
	 */
	registerCommands(): void {
		// Add command to manually add today's date to the current file
		this.addCommand({
			id: 'wl-insert-todays-date',
			name: 'Insert Today\'s Date',
			checkCallback: (checking: boolean) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view && view.file) {
					if (!checking) {
						this.updateWorkLog(view.file); // No force parameter, only add if not present
					}
					return true;
				}
				return false;
			}
		});

		// Add command to force-add today's date even if it's already present
		this.addCommand({
			id: 'wl-force-insert-todays-date',
			name: 'Force Insert Today\'s Date',
			checkCallback: (checking: boolean) => {
				const view = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (view && view.file) {
					if (!checking) {
						this.updateWorkLog(view.file, true); // Force update
					}
					return true;
				}
				return false;
			}
		});
	}

	/**
	 * Registers event handlers for file operations
	 */
	registerEvents(): void {
		// File open event - add date when opening a worklog file
		this.registerEvent(
			this.app.workspace.on('file-open', async (file: TFile | null) => {
				try {
					if (this.settings.autoAddDate && file && await this.isWorkLogFile(file)) {
						this.updateWorkLog(file);
					}
				} catch (error) {
					console.error("Error in file-open event handler:", error);
				}
			})
		);

		// Layout ready event - add date when the app layout is ready
		this.registerEvent(
			this.app.workspace.on('layout-change', async () => {
				try {
					if (this.settings.autoAddDate) {
						const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
						if (activeView && activeView.file && await this.isWorkLogFile(activeView.file)) {
							this.updateWorkLog(activeView.file);
						}
					}
				} catch (error) {
					console.error("Error in layout-ready event handler:", error);
				}
			})
		);

		// Active leaf change event - add date when switching to a worklog file
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', async (leaf) => {
				try {
					const view = leaf?.view;
					if (this.settings.autoAddDate && view instanceof MarkdownView && view.file &&
						await this.isWorkLogFile(view.file)) {
						this.updateWorkLog(view.file);
					}
				} catch (error) {
					console.error("Error in active-leaf-change event handler:", error);
				}
			})
		);
	}

	/**
	 * Determines if a file should be treated as a worklog file
	 * @param {TFile} file - The file object to check
	 * @returns {Promise<boolean>} - True if the file is a worklog file
	 */
	async isWorkLogFile(file: TFile): Promise<boolean> {
		if (!file) return false;

		// Check if filename equals "worklog" (case insensitive)
		if (file.name.toLowerCase() === this.settings.defaultWorklogFilename.toLowerCase()) {
			return true;
		}

		// Check if file path is in the target files list
		if (this.settings.targetFiles.some(path =>
			path === file.path || path === file.name)) {
			return true;
		}

		// Check if file has the worklog tag
		try {
			const metadata = this.app.metadataCache.getFileCache(file);
			if (!metadata) return false;

			// Check frontmatter tags
			if (metadata.frontmatter) {
				const tags = metadata.frontmatter.tags || [];
				if (Array.isArray(tags) && tags.includes(this.settings.worklogTag)) {
					return true;
				} else if (typeof tags === "string" && tags.includes(this.settings.worklogTag)) {
					return true;
				}
			}

			// Check inline tags (#worklog)
			if (metadata.tags && metadata.tags.some(tagObj => tagObj.tag === this.settings.worklogTag)) {
				return true;
			}
		} catch (e) {
			console.error("Error checking file tags:", e);
		}

		return false;
	}

	/**
	 * Formats a date according to the user's settings
	 * @param {Date} date - The date to format
	 * @returns {string} - The formatted date string
	 */
	formatDate(date: Date): string {
		if (!date || !(date instanceof Date)) {
			console.error("Invalid date provided to formatDate");
			date = new Date(); // Fallback to current date
		}

		// Get the format from settings
		const format = this.settings.dateFormat;

		// Get various date components
		const dayOfWeek = date.toLocaleString('en-US', { weekday: 'long' });
		const day = String(date.getDate()).padStart(2, '0');
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const year = date.getFullYear();

		// Replace tokens in the format string
		return format
			.replace(/dddd/g, dayOfWeek)
			.replace(/DD/g, day)
			.replace(/MM/g, month)
			.replace(/YYYY/g, year.toString());
	}

	/**
	 * Parses a date string according to the user's format settings
	 * @param {string} dateStr - The date string to parse
	 * @returns {Date|null} - The parsed Date object or null if parsing failed
	 */
	parseDate(dateStr: string): Date | null {
		if (!dateStr || typeof dateStr !== 'string') {
			console.error("Invalid date string provided to parseDate");
			return null;
		}

		// Use a more flexible regex to find the numeric parts of the date
		const dateRegex = /(\d{2}|\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2}|\d{4})/;
		const match = dateStr.match(dateRegex);

		if (!match) return null;

		let year: string, month: string, day: string;
		const format = this.settings.dateFormat;

		try {
			// Determine date component order based on format
			if (format.indexOf('YYYY') < format.indexOf('MM') && format.indexOf('MM') < format.indexOf('DD')) {
				// YYYY-MM-DD format
				year = match[1].length === 2 ? '20' + match[1] : match[1];
				month = match[2];
				day = match[3].length === 4 ? match[3].substr(2, 2) : match[3];
			} else if (format.indexOf('DD') < format.indexOf('MM') && format.indexOf('MM') < format.indexOf('YYYY')) {
				// DD-MM-YYYY format
				day = match[1];
				month = match[2];
				year = match[3];
			} else if (format.indexOf('MM') < format.indexOf('DD') && format.indexOf('DD') < format.indexOf('YYYY')) {
				// MM-DD-YYYY format
				month = match[1];
				day = match[2];
				year = match[3];
			} else {
				// Default to DD-MM-YYYY
				day = match[1];
				month = match[2];
				year = match[3];
			}

			// Ensure year has 4 digits
			if (year.length === 2) {
				year = '20' + year;
			}

			// Create and validate the date
			const parsedDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

			// Check if date is valid
			if (isNaN(parsedDate.getTime())) {
				console.warn(`Invalid date created from: ${dateStr}`);
				return null;
			}

			return parsedDate;
		} catch (e) {
			console.error(`Error parsing date ${dateStr}:`, e);
			return null;
		}
	}

	/**
	 * Updates the worklog file with today's date if needed
	 * @param {TFile} file - The file to update
	 * @param {boolean} force - Whether to force adding today's date even if it exists
	 * @returns {Promise<void>}
	 */
	async updateWorkLog(file: TFile, force = false): Promise<void> {
		try {
			const view = this.app.workspace.getActiveViewOfType(MarkdownView);
			if (!view || !view.editor || !file) {
				console.warn("Cannot update worklog: missing view, editor, or file");
				return;
			}

			const editor = view.editor;
			const fileContent = editor.getValue();

			// Format today's date according to the user's settings
			const today = new Date();
			const formattedDate = this.formatDate(today);

			// Check if today's date is already in the file or if we're forcing the update
			if (force || !this.hasLatestDate(fileContent, today)) {
				// Create the new content
				const newContent = this.createUpdatedContent(fileContent, formattedDate);

				// Update the file content
				editor.setValue(newContent);

				// Position cursor at the first list item after today's date
				this.positionCursorAfterDate(editor, newContent, formattedDate);
			} else {
				// Move cursor to the first list item after today's date
				this.positionCursorAfterDate(editor, fileContent, formattedDate);
			}
		} catch (error) {
			console.error("Error updating worklog:", error);
		}
	}

	/**
	 * Creates updated content with the new date
	 * @param {string} fileContent - The current file content
	 * @param {string} formattedDate - The formatted date to add
	 * @returns {string} - The updated content
	 */
	createUpdatedContent(fileContent: string, formattedDate: string): string {
		// Check if file is empty
		if (!fileContent.trim()) {
			return `#worklog\n\n### ${formattedDate}\n- \n`;
		}

		// Check for tags at the beginning of the file
		const firstLine = fileContent.trim().split('\n')[0];
		const hasTagsAtTop = /^#\w/.test(firstLine);

		if (hasTagsAtTop) {
			// If first line has tags, insert the new date after that line
			const firstLineEnd = fileContent.indexOf('\n');
			if (firstLineEnd === -1) {
				// Only one line in the file
				return `${fileContent}\n\n### ${formattedDate}\n- \n`;
			}

			return fileContent.substring(0, firstLineEnd + 1) +
				`\n### ${formattedDate}\n- \n\n----` +
				fileContent.substring(firstLineEnd + 1);
		} else {
			// No tags at the top, add new date at the beginning
			return `### ${formattedDate}\n- \n\n----\n\n${fileContent}`;
		}
	}

	/**
	 * Positions the cursor after the date heading at the first list item
	 * @param {Editor} editor - The editor object
	 * @param {string} content - The content to search in
	 * @param {string} formattedDate - The date to find
	 */
	positionCursorAfterDate(editor: any, content: string, formattedDate: string): void {
		const lines = content.split("\n");
		const dateLineIndex = lines.findIndex(line => line.includes(formattedDate));

		if (dateLineIndex !== -1 && dateLineIndex + 1 < lines.length) {
			const lineIndex = dateLineIndex + 1;
			const line = lines[lineIndex];
			const dashIndex = line.indexOf("-");

			if (dashIndex !== -1) {
				editor.setCursor({
					line: lineIndex,
					ch: dashIndex + 2
				});
			}
		}
	}

	/**
	 * Checks if the file content already contains today's date
	 * @param {string} fileContent - The content to check
	 * @param {Date} today - Today's date
	 * @returns {boolean} - True if today's date is found in the content
	 */
	hasLatestDate(fileContent: string, today: Date): boolean {
		if (!fileContent || !today) {
			return false;
		}

		try {
			// Format today's date according to the user's settings
			const formattedDate = this.formatDate(today);

			// First, check if today's exact formatted date is in the file (most common case)
			if (fileContent.includes(formattedDate)) {
				return true;
			}

			// If the formatted date isn't found, try to extract and parse dates from the content
			return this.checkForParsedDate(fileContent, today);
		} catch (error) {
			console.error("Error checking for latest date:", error);
			return false;
		}
	}

	/**
	 * Checks for parsed dates in the content to find today's date
	 * @param {string} fileContent - The content to check
	 * @param {Date} today - Today's date
	 * @returns {boolean} - True if today's date is found
	 * @private
	 */
	private checkForParsedDate(fileContent: string, today: Date): boolean {
		// Extract dates using a regex pattern
		const dateRegex = /(\d{2}|\d{4})[\/\-\.](\d{2})[\/\-\.](\d{2}|\d{4})/g;
		const matches = [...fileContent.matchAll(dateRegex)];

		if (matches.length === 0) {
			return false;
		}

		// Normalize today's date to remove time component
		const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());

		// Try to parse each date and find the latest one
		let latestDate: Date | null = null;

		for (const match of matches) {
			const dateStr = match[0];
			const parsedDate = this.parseDate(dateStr);

			if (parsedDate && (!latestDate || parsedDate > latestDate)) {
				latestDate = parsedDate;
			}
		}

		// Compare the latest date with today
		if (latestDate) {
			return latestDate.getTime() === todayDate.getTime();
		}

		return false;
	}

	/**
	 * Saves the plugin settings to disk
	 * @returns {Promise<void>}
	 */
	async saveSettings(): Promise<void> {
		try {
			await this.saveData(this.settings);
		} catch (error) {
			console.error("Error saving worklog settings:", error);
		}
	}

	/**
	 * Handles plugin unload
	 */
	onunload(): void {
		console.log('Unloading worklog plugin');
		// Clean up any resources if needed
	}
}
