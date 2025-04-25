# ![Work Log Plugin Banner](banner.png) Work Log Plugin for Obsidian



## What is a Work Log?

First and most important thing, a work log is not a to-do list. A worklog is a chronological record of completed tasks and accomplishments - not to be confused with a todo list. While todo lists focus on what you plan to do, work logs document what you've already done.
They serve as a personal changelog of your professional activities and achievements.

## Why Maintain a Work Log?
- Memory Aid: Easily recall what you worked on days, weeks, or months ago
- Status Updates: Have ready material for standups, meetings, and progress reports
- Performance Reviews: Maintain a complete record of your accomplishments for self-evaluations
- Personal Growth: Track your professional development and learning over time
- Visibility: Document your contributions to make your work visible to others

As Julia Evans notes in her ["brag documents"](https://jvns.ca/blog/brag-documents/) (this is actually what got me started a few years ago), keeping track of your work helps ensure your contributions are recognized and remembered. Similarly, as described in [Keep a Changelog at Work](https://code.dblock.org/2020/09/01/keep-a-changelog-at-work.html), a regular work log practice helps build a narrative of your professional journey.

Aside from these, the primary benefit of maintaining worklogs has been tracking my own progress, especially during periods of discouragement. Additionally, they help me understand what my time, focus, and energy were spent on, and help me see the general direction I've naturally drifted over time.

The Work Log plugin for Obsidian automates the maintenance of these valuable records by automatically managing daily work logs and adding formatted date headers to your notes.

### Example of a worklog
```
#worklog

### Monday 2025-01-06
- Fixed critical auth bypass vulnerability in JWT validation (CVE-2025-4721)
- Mentored junior security engineer on secure coding practices and code review
- Finished zero-trust architecture proposal for legacy systems
- Presented quarterly security metrics to executive leadership
- Helped colleague debug OAuth integration [issue](jira-link)
----

### Tuesday 2025-01-07
- Conducted threat modeling session for new payment processing service
- Refined architectural decision records (ADR-316) for our authentication system
- Simplified the authorization model for the Viewer role
- Met with CISO to discuss security strategy alignment with business goals [notes](link-to-notes)
- Researched zero-knowledge proof implementations for privacy enhancement
- Created a new 4-week lifting program for myself 

---
(previous days)
```

## Why?
I was maintaining a few worklogs, and manually added the date at the top every day.
It got tedious, so I created this plugin for myself, then a friend told me I should share it with the community.

## Features

- **Automatic Date Headers**: Automatically adds today's date as a header when opening worklog files
- **Multiple Worklogs**: Flexibility to have multiple worklogs (one per project) or maintain one centralized worklog—your call.
- **Customizable Date Format**: Configure how dates appear in your logs (e.g., "Monday 2023-05-01")
- **Smart File Detection**: Identifies worklog files by name, path, or tags
- **Cursor Positioning**: Automatically positions your cursor at the right spot to start typing
- **Manual Commands**: Add date headers manually when needed
- **No Duplicates**: Avoids adding duplicate date entries (unless forced)

## Installation

### From Obsidian Community Plugins

1. Open Obsidian and go to Settings
2. Navigate to "Community plugins" and disable "Safe mode" if enabled
3. Click "Browse" and search for "Work Log"
4. Click "Install" and then "Enable"

### Manual Installation

1. Clone the repo `{vault}/.obsidian/plugins/worklog/`
2. Restart Obsidian and enable the plugin in Settings > Community plugins

## Usage

### Automatic Mode

By default, the plugin automatically adds today's date to your worklog files when you open them. A worklog file is identified by:

1. Having the filename `worklog.md` (case-insensitive)
2. Being listed in the "Target Files" setting
3. Containing the worklog tag (default: `#worklog`) in frontmatter or inline

When you open a worklog file, the plugin will:
- Check if today's date is already in the file
- If not, add it at the top of the file (or after tags if present)
- Position your cursor after the date, ready for you to start typing

### Manual Commands

The plugin adds two commands that you can use with Obsidian's command palette (Ctrl/Cmd+P):

- **Insert Today's Date**: Adds today's date if it's not already in the file
- **Force Insert Today's Date**: Adds today's date even if it's already in the file

### Example Output

When the plugin adds a date to your file, it creates a structure like this:

```markdown
#worklog

### Monday 2023-05-01
- <Your Cursor Here>

----

(previous content)
```

## Settings

The plugin offers several settings to customize its behavior:

### Auto-add Date

- **Default**: Enabled
- **Description**: Automatically adds today's date when opening a worklog file
- **Usage**: Disable this if you prefer to add dates manually using commands

### Date Format

- **Default**: `dddd YYYY-MM-DD`
- **Description**: Format for date headers
- **Tokens**:
	- `YYYY`: Four-digit year (e.g., 2023)
	- `MM`: Two-digit month (e.g., 05)
	- `DD`: Two-digit day (e.g., 01)
	- `dddd`: Full day name (e.g., Monday)
- **Examples**:
	- `dddd DD-MM-YYYY` → Monday 01-05-2023
	- `YYYY-MM-DD dddd` → 2023-05-01 Monday
	- `MM/DD/YYYY` → 05/01/2023

### Worklog Tag

- **Default**: `#worklog`
- **Description**: Files with this tag will be treated as work logs
- **Usage**: Change this if you want to use a different tag to identify worklog files

### Target Files

- **Default**: Empty (no target files)
- **Description**: Files to be treated as work logs (one path per line)
- **Usage**: Add file paths (relative to vault root) to automatically treat them as worklog files

### Default Worklog Filename

- **Default**: `worklog.md`
- **Description**: Files with this name (case insensitive) will be treated as work logs
- **Note**: This setting is not exposed in the UI but can be modified in the data.json file

## Troubleshooting

- **Date Not Adding**: Make sure the file is recognized as a worklog file (check name, path, or tags)
- **Wrong Date Format**: Verify your date format setting and adjust as needed
- **Cursor Not Positioning**: Ensure your file structure matches the expected format

## License

This plugin is licensed under the MIT License. See the LICENSE file for details.

## Support and Contribution

- Report issues on the [GitHub repository](https://github.com/samyghannad/obsidian-worklog/issues)
- Contribute to the development by submitting pull requests

