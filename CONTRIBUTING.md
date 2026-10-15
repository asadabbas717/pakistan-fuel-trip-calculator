# Contributing to SafarWise

SafarWise is publicly viewable under a [restrictive source-available license](LICENSE). Public visibility permits inspection and collaboration; it does not grant permission to republish the app. The project owner is identified by the GitHub account [asadabbas717](https://github.com/asadabbas717).

## What you may do

- Report bugs and suggest improvements through issues.
- Fork using GitHub's features, clone locally, and make private modifications/test builds for evaluation, testing and preparing contributions.
- Submit a pull request to the official repository, preserving ownership and third-party notices.

Publishing a competing or modified app, distributing builds, hosting it for others or reusing protected project code in another product requires the owner's prior written permission, even when offered for free. See the license for the complete terms.

## Ownership and accepting contributions

Cloning or submitting a pull request does not transfer ownership of existing SafarWise code to a contributor. Equally, a pull request or checkbox does not automatically transfer a contributor's copyright to the project owner.

Before accepting copyrightable external code, the owner must confirm the contributor has the necessary rights and obtain a separate signed copyright assignment where needed to keep ownership of original project code with the owner. The agreement must identify the parties, contribution and rights transferred; a qualified lawyer should prepare or review it. If the contributor is an employee, the employer may need to authorize the contribution or sign the agreement.

**Maintainers must not merge copyrightable external code until this review and the necessary assignment are complete.** Opening a pull request is allowed for discussion and review; it does not guarantee acceptance. Bug reports, suggestions and trivial edits may not require an assignment; assess them individually. Third-party licensed code must remain identified as third-party material and must never be represented as assigned project-owned code.

Do not submit code copied from another project unless its origin, license and compatibility have been reviewed. Do not include secrets, signing keys, personal location data or private backups. Retain the Leaflet license and all other required third-party notices.

## Checking a change

Use Node.js 22.13 or newer, run `npm ci`, then `npm run check` and `npm run audit:security`. Changes to UI, native configuration or dependencies also need appropriate Expo compatibility/build checks. The app must remain usable without paid runtime APIs or services. Describe the change, relevant tests and any remaining limitations in the pull request.
