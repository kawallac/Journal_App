# Journal_App
Web application to fit my journaling needs

v0.1 Basic conetp layout
v0.2 Added image upload functionality
v0.3 Added tag functionality
v0.3.1 Improve UI of tag functionality, arrange overall app UI
v0.3.2 Improved UI with prev, next buttons for entries
v0.4 (ChatGPT BASELINE) Added Search Capability, overall UI polishing
v0.4.1
	-A migrating data model (safe for future notebooks, attachments, backend)
	-A journalService layer you can later swap to an API.
	-notebookId: "default" everywhere.
	-An Export JSON button so your “center hub of thoughts” is never locked in
	-Created project documentation
		DATA_MODEL.md
		ARCHITECTURE.md
		API_SKETCH.md
		SECURITY_NOTES.md
		PROJECT_STRUCTURE.md
		DEPLOYMENT_PLAN.md
		BACKEND_BLUEPRINT.md
		UX_NOTES.md

v0.4.2 Corrected prev/next buttons, entries are chronological order
v0.4.3 Inprogress, Add a calendar in the left sidebar
	-functioning, but still needs improvements

v0.4.3.2 Added tag bar and moved image storage to IndexDB
v0.4.3.3 stopped the tag on photo auto paste
v0.4.3.4 drag and drop from the tag bar
v0.4.3.5 polished tag bar
v0.4.4.0 (25.12.10)
	-fixed tag pill showing centered on photo at new tag execution
	-Fixed timezone issue with calendar
	-Added method to delete tags
v0.4.4.1 (25.12.11)
	-improved double click feel on tag pills
	-moved new entry and new tag buttons to the page entry form
	-removed status box in the page header
	-changed style of buttons on top of the entry page
v0.4.5 
	-refined entry deletion action
		-dialog window appears to confirm deletion
v0.4.5.1
	-first MED-lite revamp
v0.4.5.2
	-Med-lite on calendar
v0.4.6
	-added drag drop photo
	-removed "Tip:" that sat above the photo box
	-added ability to delete photo
v0.4.10
	-removed back to journal, replaced with an 'x' in search results card
v0.4.20
	-improving functionality of save
		-no longer resets chronological order
		-refreshes day results card
		-if date is changed, the new day results card is shown
		-save is deactivate when nothing is changed, active when something did change
		-improved UX for the tag dialog box
v0.4.21
	-ran UX theme pass
v0.4.22
	-further polishing app theme
		-Warm/Handcrafted theme tokens are the current baseline
v0.4.23
	-refined app version broadcast (under the Journal App, left side of the header)
		-variable APP_VERSION in app.js controls
	-refined status message broadcast (right side of header)

v0.4.24
	-added photo zoom functionality

v0.4.25
	-removed red x button in delete photo/entry dialog boxs
	-centered the x in the photo delete button

v0.4.26
	-add tag management through search

v0.4.27
	-added multiple journals

v0.4.28
	-search is discrete to a journal except for special syntax
		-scope:all or all:

v0.4.29
	-stablized code

v1.0 Beta, Stable
	-add import json
	-further stabilized code base

v1.1
	-forces camera to be used on the phone

v1.2
	-new add photo button that has secondary menu for file/camera

working folder
	

# Notes


