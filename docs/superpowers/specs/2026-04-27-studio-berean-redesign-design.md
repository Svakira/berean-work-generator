# Studio Berean Redesign Design

## Goal

Redesign Studio Berean so the product feels trustworthy, editorial, and professional while preserving the current workbook-generation behavior. The redesign should make the interface easier to read, easier to navigate, and clearer about what the user should do next across the home page, generator, guide viewer, and template browsing flow.

## Product Direction

- Primary objective: trust and clarity
- Redesign depth: structure plus visuals
- Visual direction: editorial study desk with a brighter white surface and sky-blue accents for important actions and state
- Interaction principle: the main task always owns the strongest visual weight; secondary tools move to rails, inspector areas, or separate pages

## Page-Level Design

### Home

The home page becomes a calmer editorial landing page instead of a stack of generic cards. The top area uses a clean masthead, a reading-first hero, and clearer vertical rhythm. The page should explain what Studio Berean does, who it is for, and why it is trustworthy without crowding the screen.

Key behaviors:

- `Open Generator` stays the primary path
- `Browse Templates` links to the template library page
- `Continue where you left off` remains available when local history exists
- Sections use spacing and divider rules more than repeated boxed cards

### Generator

The generator becomes a focused workspace.

Top structure:

- Template band: compact row of visible templates plus an inline `+` control immediately after the last visible template
- `+` links to a dedicated template library page rather than opening a large block inside the generator
- Service/context band sits below the template row and contains system state plus quick actions
- `Ask a question` links to `https://berean.ai`

Workspace structure:

- Left rail: Study Coach and Recent Guides
- Center: title, prompt, format controls, study brief preview, and the single primary `Generate workbook` CTA
- Right rail: build settings, progress/quality, session signals, trace summary

Behavioral requirements:

- Template selection still loads preset data into the generator form
- Teacher mode still reveals teacher-only controls
- Generation still saves the guide to local history and opens the guide page
- Existing progress, quality, and transparency data continue to work but are visually demoted relative to the main composition surface

### Template Library

The template library moves to its own page so the generator remains focused. This page supports browsing more templates without interrupting the current build flow.

Key behaviors:

- Filter/search template catalog
- Show category, title, audience, format, duration, and theme
- Show prompt details for each template
- Show a short expected-result preview for each template
- Provide actions to use a template in the generator, copy the prompt, and download prompt metadata

### Guide

The guide page becomes reading-first and much less tool-heavy.

Header:

- `Back to generator` appears as a plain text link with a leading arrow icon
- Extra spacing separates navigation from the guide content

Main layout:

- Left/main column: title, metadata chips, and the reading surface
- Right column: export actions and minimal guide utilities

Removed from the primary guide experience:

- Inline `Edit guide info`
- `Section editor`
- Quality panel

Retained in simplified form:

- Export PDF / Markdown / HTML / copy markdown
- Save version / pin / compare utilities
- Trace and telemetry can remain accessible, but should not dominate the page

## Visual System

- Backgrounds should be brighter white, not beige-heavy
- Sky blue is the primary emphasis color for active states, important CTA buttons, selected templates, and key service cues
- Typography remains editorial and readable, with serif display headings and clean sans-serif support text
- Cards are used sparingly; large sections should rely on spacing, alignment, and rules before boxing content

## Backend Implications

The redesign needs small but real backend support:

- Add a dedicated `/templates` route serving a new template library page
- Expand premade template data to include short display-friendly preview metadata for the library page
- Keep `/api/premade` as the template source for both generator and library page
- Preserve `/api/generate`, existing workbook generation, caching, and health behavior

## Frontend Structure Changes

- Replace the current home, generator, and guide markup with layouts that match the approved redesign
- Add a dedicated template library page and script
- Refresh the stylesheet to reflect the new layout system and visual hierarchy
- Update generator and guide scripts so they target the new DOM structure without removing existing business behavior

## Testing and Verification

- Existing workbook engine tests must continue to pass
- Add server tests for the new `/templates` route and enriched `/api/premade` response shape
- Manually verify:
  - home page layout
  - generator template row and `+` navigation
  - template library flow back into generator
  - Ask a question link
  - guide reading-first layout
  - export actions still work

## Scope Boundaries

Included:

- Redesign and restructure of current pages
- Dedicated template library page
- Minimal backend support to serve the new page and richer template metadata

Not included:

- Database persistence
- Authentication
- Real server-side saved-guide storage
- New generation logic beyond what is needed to support the redesigned flows
