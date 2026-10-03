# Business Requirements Document (BRD)

## Internship Management & Tracking Platform

**Document Type:** Business Requirements Document
**Audience:** Internship Mentors, Product Owners, Business Analysts, Software Engineering Interns
**Product:** Internship Management & Tracking Platform
**Status:** MVP Requirements Baseline

---

# 1. Executive Summary

The Internship Management & Tracking Platform is a centralized system for managing the complete internship journey, from internship-program applications through interviews, acceptance, onboarding, active internship work, task submission, feedback, progress tracking, and completion.

The platform is intended to replace fragmented tracking of interns, applications, interviews, assignments, submissions, mentors, and progress with a single source of truth.

The system has two primary roles:

* **Intern** — participates in an internship and interacts with applications, interviews, tasks, submissions, feedback, and progress.
* **Staff** — a unified role covering administrative and mentoring responsibilities. Staff permissions may differ according to their responsibilities.

There are **no separate Admin and Mentor roles**, and the platform does **not** include mentoring-session functionality. Staff members are assigned to interns for tracking and mentoring purposes, and the system records those assignments and workloads.

The initial implementation is intended to be an MVP suitable for software engineering interns. Requirements therefore focus on the essential business workflows rather than advanced enterprise functionality.

---

# 2. Product Overview

## 2.1 Product Purpose

The platform should provide a single system through which staff can:

* Manage internship programs.
* Receive and review applications.
* Manage applicant statuses.
* Schedule and manage interviews.
* Accept applicants into internship programs.
* Assign staff members to interns.
* Assign and review internship tasks.
* Track submissions and feedback.
* Monitor intern progress.
* Monitor mentor/staff workload.
* View operational dashboards.
* Maintain important historical records.

Interns should be able to:

* Apply for internship programs.
* Track their applications.
* View interviews.
* View their assigned staff mentor.
* View assigned tasks.
* Submit work.
* Receive feedback.
* Track their internship progress.

## 2.2 Technology Context

The platform will be implemented using:

* **Frontend:** Next.js
* **Backend:** NestJS
* **Database:** PostgreSQL
* **ORM:** Prisma

These technologies establish the implementation context but do not prescribe the internal technical architecture.

## 2.3 Product Principles

The product should follow these principles:

1. **Single source of truth**
   Internship information should be managed centrally.

2. **Clear ownership**
   Users should know who is responsible for applications, interns, tasks, and reviews.

3. **Traceability**
   Important business changes should be historically traceable.

4. **Simple workflows**
   The MVP should avoid unnecessary complexity.

5. **Explicit status management**
   Business entities should have clearly defined lifecycle states.

6. **Actionable information**
   Dashboards should help users understand what requires attention.

7. **Role-based access**
   Users should only access information appropriate to their responsibilities.

---

# 3. Business Goals

The platform must support the following business goals:

| Goal                             | Description                                                                 |
| -------------------------------- | --------------------------------------------------------------------------- |
| Centralize internship management | Manage internship operations in one platform.                               |
| Manage programs                  | Create, publish, operate, complete, and archive internship programs.        |
| Manage applications              | Handle the applicant journey from application through acceptance/rejection. |
| Track applications               | Provide applicants and staff with clear application status.                 |
| Manage interviews                | Schedule, assign, reschedule, cancel, and record interview results.         |
| Manage interns                   | Maintain intern information and internship status.                          |
| Assign mentors                   | Assign staff members to interns and monitor workload.                       |
| Manage tasks                     | Create, assign, track, review, and approve internship tasks.                |
| Track submissions                | Allow interns to submit work and staff to review it.                        |
| Track progress                   | Give staff and interns visibility into internship progress.                 |
| Provide dashboards               | Surface operational statistics and upcoming work.                           |
| Maintain history                 | Preserve important business changes and actions.                            |

---

# 4. Scope

## 4.1 MVP In Scope

The MVP includes:

* Authentication and user accounts.
* Intern profiles.
* Staff accounts.
* Internship programs.
* Program requirements.
* Program publishing/opening/closing.
* Internship applications.
* Application status management.
* Application review.
* Interview scheduling and management.
* Applicant acceptance/rejection.
* Internship lifecycle management.
* Staff/mentor assignment.
* Mentor workload tracking.
* Internship tasks.
* Task assignment.
* Task submissions.
* Submission review.
* Feedback.
* Task approval/change requests.
* Intern progress tracking.
* Intern dashboard.
* Staff dashboard.
* Search/filtering/sorting/pagination.
* CV and internship-document management.
* Task-submission files.
* Notifications.
* Audit/history for important actions.

## 4.2 Out of Scope for MVP

The following should not be implemented unless explicitly approved:

* Mentoring sessions.
* Video conferencing.
* Built-in chat.
* Advanced HR/payroll functionality.
* Attendance and time tracking.
* Performance reviews beyond task/progress tracking.
* Automated candidate scoring.
* AI-based applicant evaluation.
* Advanced analytics and predictive reporting.
* Complex organizational hierarchies.
* External recruitment integrations.
* Enterprise workflow automation.

---

# 5. User Roles

## 5.1 Intern

An Intern is a person participating in an internship.

### Capabilities

An Intern can:

* Register and log in.
* Manage their profile.
* Upload/update their CV.
* Upload required internship documents.
* Browse available internship programs.
* Apply to a program.
* Track their application.
* View interview information related to their application.
* View their assigned staff mentor.
* View assigned tasks.
* View task details and deadlines.
* Submit tasks.
* Track submission status.
* View staff feedback.
* Track internship progress.

An Intern must not:

* View other applicants' applications.
* View other interns' private information.
* Create or modify internship programs.
* Assign mentors.
* Review other interns' submissions.
* Change their own official internship status.
* Modify application decisions.

---

# 5.2 Staff

Staff is a unified role combining administrative and mentoring responsibilities.

A Staff member may have different permissions depending on their assigned responsibilities.

Staff capabilities include:

### Programs

* Create programs.
* Edit programs.
* Publish programs.
* Open/close applications.
* Define requirements.
* Define capacity.
* Define dates.
* Archive programs.

### Applications

* View applications they are authorized to access.
* Search/filter applications.
* Review applications.
* Shortlist applicants.
* Schedule interviews.
* Change application status.
* Accept/reject applicants.

### Intern Tracking

* View interns.
* View intern profiles.
* Assign interns.
* View internship progress.
* Track tasks.
* Track internship status.

### Mentor Tracking

* View assigned interns.
* Monitor workload.
* Monitor intern progress.

### Tasks

* Create tasks.
* Assign tasks.
* Modify tasks when permitted.
* Define descriptions/deadlines/priorities.
* Review submissions.
* Provide feedback.
* Approve submissions.
* Request changes.
* Reopen tasks when permitted.

### Interviews

* Create interviews.
* Assign interviewers.
* Schedule interviews.
* Reschedule interviews.
* Cancel interviews.
* Complete interviews.
* Record results.

---

# 6. Functional Requirements

## FR-01 Authentication & User Accounts

### Description

The system must allow Interns and Staff members to authenticate and access functionality according to their permissions.

### Actors

* Intern
* Staff

### Business Rules

* Every user must have an identifiable account.
* A user must only access functionality permitted by their role and permissions.
* An Intern cannot access Staff functionality.
* Staff permissions may differ between staff members.

### User Stories

> As an intern, I want to log into the platform so that I can access my internship information.

> As a staff member, I want to log into the platform so that I can manage internship operations.

### Acceptance Criteria

* Users can authenticate successfully.
* Invalid authentication does not grant access.
* Interns cannot access staff-only functionality.
* Staff can access functionality for which they have permission.
* Users can log out.

---

# 7. Application Lifecycle

## 7.1 Lifecycle

The application lifecycle is:

**APPLIED → UNDER_REVIEW → SHORTLISTED → INTERVIEW → ACCEPTED / REJECTED**

Only explicitly permitted transitions are allowed.

---

## 7.2 APPLIED

### Meaning

The applicant has submitted an application to an available program.

### Entry

Created when an eligible Intern successfully applies.

### Allowed Transition

`APPLIED → UNDER_REVIEW`

### Rules

* The application must belong to a valid program.
* The program must allow applications.
* The same Intern cannot apply twice to the same program.

---

## 7.3 UNDER_REVIEW

### Meaning

Staff is reviewing the applicant's information.

### Allowed Transitions

* `UNDER_REVIEW → SHORTLISTED`
* `UNDER_REVIEW → REJECTED`

### Rules

Staff should review the application before making a decision.

---

## 7.4 SHORTLISTED

### Meaning

The applicant has passed the initial review and is selected for interview consideration.

### Allowed Transition

`SHORTLISTED → INTERVIEW`

A direct transition from `SHORTLISTED → ACCEPTED` should not occur unless explicitly approved.

**BUSINESS DECISION REQUIRED:** Whether shortlisted applicants can be accepted without an interview.

---

## 7.5 INTERVIEW

### Meaning

The applicant is in the interview stage.

An interview should exist or be scheduled for the application.

### Allowed Transitions

* `INTERVIEW → ACCEPTED`
* `INTERVIEW → REJECTED`

### Rules

The application should not be accepted solely because an interview was scheduled. The interview result should be recorded before final acceptance unless an explicit exception exists.

---

## 7.6 ACCEPTED

### Meaning

The applicant has been accepted into the internship.

### Effects

* The application becomes successful.
* The applicant becomes eligible for internship onboarding.
* An internship record/status should become active through the internship lifecycle.

---

## 7.7 REJECTED

### Meaning

The application has been rejected.

### Rules

A rejected application cannot directly become accepted.

If a rejected applicant should be reconsidered:

**BUSINESS DECISION REQUIRED:** Define whether staff may reopen/reconsider a rejected application or whether the applicant must apply to another program.

---

# 8. Internship Lifecycle

## 8.1 Lifecycle

**ACCEPTED → ONBOARDING → ACTIVE → COMPLETED / DROPPED**

---

## 8.2 ACCEPTED

The applicant has been accepted but has not yet started the active internship.

### Rules

* The intern may be assigned required onboarding documents.
* Staff may assign a mentor before the internship starts.
* The intern should not be treated as actively working until entering `ACTIVE`.

---

## 8.3 ONBOARDING

The accepted applicant is completing the required preparation before starting.

### Possible Requirements

* Required documents.
* Profile completion.
* Mentor assignment.
* Initial tasks/instructions.

**BUSINESS DECISION REQUIRED:** Define the exact conditions required to complete onboarding.

---

## 8.4 ACTIVE

The intern is actively participating in the internship.

During this state:

* Tasks can be assigned.
* Tasks can be submitted.
* Staff can review work.
* Progress is tracked.
* Mentor assignment is active.

---

## 8.5 COMPLETED

The internship has successfully ended.

### Rules

* The internship is no longer active.
* New regular tasks should not be assigned.
* Task submission after completion should not be allowed unless explicitly permitted.

---

## 8.6 DROPPED

The intern has stopped participating before completing the internship.

### BUSINESS DECISION REQUIRED

Define who can mark an intern as dropped and whether a reason is mandatory.

---

# 9. Task Lifecycle

## 9.1 Lifecycle

**PENDING → IN_PROGRESS → SUBMITTED → UNDER_REVIEW → APPROVED / CHANGES_REQUESTED**

When changes are requested:

**CHANGES_REQUESTED → IN_PROGRESS → SUBMITTED → UNDER_REVIEW**

---

## 9.2 PENDING

Task exists and has been assigned but work has not started.

## 9.3 IN_PROGRESS

The Intern has started working on the task.

## 9.4 SUBMITTED

The Intern has submitted work for review.

## 9.5 UNDER_REVIEW

A Staff member is reviewing the submission.

## 9.6 APPROVED

The Staff reviewer has accepted the submission.

An approved task is considered successfully completed.

## 9.7 CHANGES_REQUESTED

The Staff reviewer requires modifications.

The Intern may update and resubmit the task.

---

## 9.8 Task Rules

### Creation

Staff creates tasks.

### Assignment

Staff assigns tasks to Interns.

### Modification

Staff may modify task information before completion, subject to permission rules.

### Submission

Only the assigned Intern can submit their task.

### Review

Authorized Staff members review submissions.

### Resubmission

Resubmission is allowed after `CHANGES_REQUESTED`.

### Deadline

The system must identify tasks whose deadline has passed.

**BUSINESS DECISION REQUIRED:** Whether submission after the deadline should be blocked or allowed but marked late.

### Reopening

**BUSINESS DECISION REQUIRED:** Whether an approved task can be reopened and who can reopen it.

---

# 10. Mentor Assignment

## 10.1 Purpose

Mentor assignment connects an Intern with a Staff member responsible for tracking and supporting that Intern.

There are **no mentoring sessions**.

---

## 10.2 Assignment Requirements

Staff must be able to:

* Assign a Staff member to an Intern.
* View assigned interns for each Staff member.
* View mentor workload.
* View intern progress by mentor.
* Change assignments.

---

## 10.3 Assignment Model

### Multiple Mentors per Intern

**BUSINESS DECISION REQUIRED:** Can one Intern have multiple active mentors?

Recommended MVP assumption: one primary Staff mentor per Intern.

### Maximum Interns per Mentor

**BUSINESS DECISION REQUIRED:** Whether there is a maximum workload.

If a maximum is defined, the system should warn or prevent assignment when the limit is reached.

### Assignment Changes

Assignments can be changed by authorized Staff.

### Assignment History

Previous assignments should be preserved historically.

### Mentor Removal

If a Staff member becomes unavailable:

* Existing assignments must not silently disappear.
* Assigned interns must remain associated with their historical mentor.
* A new mentor may be assigned.

**BUSINESS DECISION REQUIRED:** Whether the system should automatically identify unassigned interns and notify authorized staff.

---

# 11. Internship Programs

## 11.1 Program Lifecycle

**DRAFT → OPEN → CLOSED → IN_PROGRESS → COMPLETED → ARCHIVED**

---

## 11.2 DRAFT

The program is being prepared.

Staff can:

* Define program information.
* Define requirements.
* Define dates.
* Define capacity.
* Edit the program.

Applicants cannot apply.

---

## 11.3 OPEN

Applications are open.

Rules:

* Eligible Interns can apply.
* Applications are accepted until the configured closing condition.
* Capacity rules must be enforced.

---

## 11.4 CLOSED

Applications are no longer accepted.

Existing applications continue through the application process.

---

## 11.5 IN_PROGRESS

The internship program is currently running.

Interns may participate and complete tasks.

---

## 11.6 COMPLETED

The program has ended.

No new internship participation should begin.

---

## 11.7 ARCHIVED

The program is retained for historical purposes but is no longer operational.

Archived programs cannot accept applications.

---

## 11.8 Program Requirements

A program should contain, at minimum:

* Program name.
* Description.
* Requirements.
* Application opening/closing information.
* Internship start date.
* Internship end date.
* Available seats.
* Program status.

### Capacity

When capacity is reached:

**BUSINESS DECISION REQUIRED:** Whether the program should automatically close applications or simply prevent additional accepted applicants.

---

# 12. Interviews

## 12.1 Purpose

Interviews evaluate applicants before the final application decision.

## 12.2 Requirements

Staff can:

* Create an interview.
* Associate it with an application.
* Assign an interviewer.
* Set date/time.
* Reschedule.
* Cancel.
* Complete the interview.
* Record the result.

---

## 12.3 Interview Lifecycle

Recommended lifecycle:

**SCHEDULED → COMPLETED**

Alternative states:

**SCHEDULED → CANCELLED**

and

**SCHEDULED → RESCHEDULED**

Rescheduling should result in an updated scheduled interview rather than creating ambiguity about the current appointment.

---

## 12.4 Interview Rules

* An interview belongs to an application.
* An application can have interview information.
* The interviewer must be a Staff member.
* Only authorized Staff can modify interview details.
* A completed interview should contain a recorded result.

**BUSINESS DECISION REQUIRED:** Whether one application may have multiple interviews.

---

# 13. Notifications

Notifications should communicate important events without prescribing how they are technically delivered.

## Notification Matrix

| Trigger                    | Recipient | Required Information                     | Timing                           |
| -------------------------- | --------- | ---------------------------------------- | -------------------------------- |
| Application submitted      | Staff     | Applicant + program + application status | After submission                 |
| Application status changed | Intern    | Program + new status                     | When status changes              |
| Interview scheduled        | Intern    | Date + time + interviewer + application  | Immediately after scheduling     |
| Interview changed          | Intern    | Updated interview information            | After change                     |
| Interview cancelled        | Intern    | Cancellation + interview information     | Immediately                      |
| Task assigned              | Intern    | Task + deadline + priority               | After assignment                 |
| Task deadline approaching  | Intern    | Task + deadline                          | According to configured reminder |
| Submission reviewed        | Intern    | Task + review status                     | After review                     |
| Feedback received          | Intern    | Task + feedback                          | After feedback                   |
| Mentor assigned            | Intern    | Staff mentor information                 | After assignment                 |
| Internship status changed  | Intern    | New internship status                    | After change                     |

**BUSINESS DECISION REQUIRED:** Exact timing for deadline reminders.

---

# 14. Dashboards

## 14.1 Intern Dashboard

### Required Metrics/Information

* Internship status.
* Overall progress.
* Task statistics.
* Upcoming deadlines.
* Recent feedback.
* Mentor information.
* Interview information.

### Task Statistics

At minimum, the Intern should be able to understand:

* Pending tasks.
* In-progress tasks.
* Submitted tasks.
* Tasks under review.
* Approved tasks.
* Tasks requiring changes.

---

## 14.2 Staff Dashboard

### Required

* Total interns.
* Active interns.
* Completed interns.
* Applications.
* Application statuses.
* Upcoming interviews.
* Mentor workload.
* Task completion statistics.
* Intern progress.

### Optional

* Application conversion statistics.
* Overdue tasks.
* Unassigned interns.
* Programs approaching capacity.
* Programs approaching deadlines.

---

# 15. Search, Filtering, Sorting & Pagination

## 15.1 Applications

Staff should be able to:

* Search by applicant name.
* Search by email.
* Filter by status.
* Filter by program.
* Filter by application date.
* Sort by relevant fields.
* Paginate results.

## 15.2 Interns

Staff should be able to:

* Search interns.
* Filter by program.
* Filter by mentor.
* Filter by internship status.
* Filter by progress.
* Sort results.
* Paginate results.

## 15.3 Tasks

Staff should be able to:

* Filter by status.
* Filter by Intern.
* Filter by deadline.
* Filter by priority.
* Sort results.
* Paginate results.

Interns should be able to search/filter their own tasks where useful.

---

# 16. Files & Documents

## 16.1 CV

### Upload

Intern.

### View

* Intern.
* Authorized Staff.

### Replace

Intern may replace their CV.

### Delete

**BUSINESS DECISION REQUIRED:** Whether an Intern may delete a CV after submitting an application.

### Version History

**BUSINESS DECISION REQUIRED:** Whether previous CV versions must be preserved.

---

## 16.2 Internship Documents

### Upload

Intern, and potentially Staff where required.

### View

Authorized Staff and the relevant Intern.

### Replace

**BUSINESS DECISION REQUIRED:** Define whether Interns can replace documents after submission.

### Delete

**BUSINESS DECISION REQUIRED:** Define deletion rules.

### Versioning

Previous versions should be preserved if the document is legally or operationally important.

**BUSINESS DECISION REQUIRED:** Identify which documents require version history.

---

## 16.3 Task Submission Files

### Upload

Assigned Intern.

### View

* Assigned Intern.
* Authorized Staff reviewer.

### Replace

Allowed while the task is editable and before final approval.

### Delete

**BUSINESS DECISION REQUIRED:** Define whether submitted files can be deleted.

### Version History

Recommended when resubmissions are allowed.

---

# 17. Permissions Matrix

| Action                    | Intern               | Staff                          |
| ------------------------- | -------------------- | ------------------------------ |
| Register/login            | Own                  | Own                            |
| Manage own profile        | ✓                    | ✓                              |
| Upload own CV             | ✓                    | —                              |
| View own CV               | ✓                    | Authorized                     |
| Browse open programs      | ✓                    | ✓                              |
| Apply to program          | ✓                    | —                              |
| View own application      | ✓                    | ✓                              |
| View applications         | Own only             | Authorized                     |
| Review applications       | —                    | ✓                              |
| Change application status | —                    | Authorized                     |
| Create program            | —                    | ✓                              |
| Edit program              | —                    | ✓                              |
| Publish program           | —                    | ✓                              |
| Archive program           | —                    | ✓                              |
| Schedule interview        | —                    | ✓                              |
| View own interview        | ✓                    | ✓                              |
| Modify interview          | —                    | Authorized                     |
| Record interview result   | —                    | Authorized                     |
| Assign mentor             | —                    | Authorized                     |
| View assigned interns     | —                    | ✓                              |
| View mentor workload      | —                    | ✓                              |
| Create task               | —                    | ✓                              |
| Assign task               | —                    | ✓                              |
| Modify assigned task      | —                    | Authorized                     |
| View own tasks            | ✓                    | ✓                              |
| Submit task               | ✓                    | —                              |
| Review submission         | —                    | Authorized                     |
| Provide feedback          | —                    | Authorized                     |
| Approve submission        | —                    | Authorized                     |
| Request changes           | —                    | Authorized                     |
| View own progress         | ✓                    | ✓                              |
| View intern progress      | —                    | Authorized                     |
| Change internship status  | —                    | Authorized                     |
| View audit history        | Own relevant history | Authorized                     |
| Manage users              | —                    | **BUSINESS DECISION REQUIRED** |

### Ownership Rule

"Authorized Staff" means a Staff member with the necessary permission for that action.

A Staff member should not automatically gain unrestricted access merely because they have the Staff role.

---

# 18. Business Rules

## Confirmed Business Rules

### BR-01

An Intern cannot apply to the same program more than once.

### BR-02

Only programs that are accepting applications can receive new applications.

### BR-03

Archived programs cannot accept applications.

### BR-04

Applications follow a defined lifecycle and arbitrary status changes are not allowed.

### BR-05

A rejected application cannot directly become accepted without an explicitly defined transition.

### BR-06

Only authorized Staff can review applications.

### BR-07

Only Staff can create and assign internship tasks.

### BR-08

Only the assigned Intern can submit their task.

### BR-09

A task cannot be approved before a submission exists.

### BR-10

Changes requested by Staff allow the Intern to resubmit the task.

### BR-11

Only authorized Staff can review submissions.

### BR-12

Interns can view their own internship progress.

### BR-13

Staff can view progress for interns they are authorized to monitor.

### BR-14

Important status and assignment changes should be historically recorded.

### BR-15

There are no mentoring sessions in the product scope.

### BR-16

Staff is a unified role rather than separate Admin and Mentor roles.

---

# 19. Edge Cases

## 19.1 Intern Withdraws Application

**BUSINESS DECISION REQUIRED:** The original requirements mention withdrawal but do not define a withdrawal status.

The business should decide whether:

* `WITHDRAWN` becomes an official application status, or
* Staff manually handles withdrawal outside the standard lifecycle.

---

## 19.2 Program Reaches Capacity

The system must prevent the number of accepted applicants from exceeding available capacity.

**BUSINESS DECISION REQUIRED:** Whether applications automatically close when capacity is reached.

---

## 19.3 Mentor Becomes Unavailable

Existing assignment history must remain intact.

The Intern should be reassigned to another Staff member by an authorized Staff member.

---

## 19.4 Intern Changes Mentor

The previous assignment should remain in historical records.

The new assignment becomes the current assignment.

---

## 19.5 Interview Cancelled

The applicant should be informed.

The application should remain in an appropriate interview-stage state until another interview is scheduled or a final decision is made.

---

## 19.6 Interview Rescheduled

The current interview date/time should be updated and the applicant notified.

The history of the change should be retained.

---

## 19.7 Task Deadline Passes

The system should identify the task as overdue.

**BUSINESS DECISION REQUIRED:** Whether overdue tasks remain submittable.

---

## 19.8 Multiple Task Submissions

If resubmission is allowed, each submission should be distinguishable historically.

The latest valid submission should be identifiable.

---

## 19.9 Staff Reviews Another Mentor's Intern

Access depends on Staff permissions.

If Staff members are restricted to their assigned interns, they must not review the intern's work.

If Staff have broader permissions, authorized Staff can perform the review.

---

## 19.10 Internship Ends With Incomplete Tasks

The system should preserve incomplete task information.

**BUSINESS DECISION REQUIRED:** Whether incomplete tasks are automatically closed, remain open, or require explicit Staff action.

---

## 19.11 Intern Is Dropped

The Intern's internship status becomes `DROPPED`.

Existing application, task, and history information should remain accessible to authorized Staff.

---

## 19.12 Program Archived While Applications Exist

The program should remain accessible historically.

Existing applications should not be deleted.

Archiving must not destroy historical application information.

---

# 20. Audit & History

The platform should maintain historical records for important business events.

## Required History

### Applications

Record:

* Status changes.
* Relevant timestamps.
* Staff member responsible for the change.

### Mentor Assignments

Record:

* Previous mentor.
* New mentor.
* Assignment date.
* End date where applicable.
* Staff member responsible.

### Tasks

Record:

* Status changes.
* Assignment changes.
* Submission events.
* Reviews.
* Feedback.
* Approval/change requests.

### Interviews

Record:

* Scheduling.
* Rescheduling.
* Cancellation.
* Completion.
* Result changes.

### Internship

Record:

* Status changes.
* Mentor changes.
* Important completion/drop decisions.

The BRD does not prescribe how this history is technically stored.

---

# 21. Non-Functional Requirements

These requirements should remain appropriate for an internship project.

## 21.1 Security

* Sensitive information must only be accessible to authorized users.
* Users must not access another user's private information through normal application workflows.
* Uploaded documents must not be publicly accessible without authorization.

## 21.2 Authentication

* Users must authenticate before accessing protected functionality.
* Authentication failures must not reveal sensitive information.

## 21.3 Authorization

* Permissions must be enforced consistently.
* Staff permissions should determine access to administrative/mentoring functionality.
* Ownership restrictions must be respected.

## 21.4 Data Privacy

Applicant and intern information should only be visible to authorized users.

CVs and internship documents should not be exposed publicly.

## 21.5 Performance

Normal user actions should provide a responsive experience.

Large lists should not require loading every record at once.

## 21.6 Reliability

Business data should not be lost because of normal user actions or validation failures.

## 21.7 Validation

The system should validate:

* Required fields.
* Dates.
* Status transitions.
* Program eligibility.
* Duplicate applications.
* Task ownership.
* File requirements.

## 21.8 Error Handling

Errors should:

* Clearly communicate what went wrong.
* Avoid exposing technical/internal details.
* Allow users to recover where possible.

## 21.9 Accessibility

The primary workflows should be usable by people with common accessibility needs.

## 21.10 Responsiveness

The application should be usable on desktop and mobile-sized screens.

---

# 22. User Stories

## Intern Stories

### US-I01

As an Intern, I want to create an account so that I can participate in internship programs.

### US-I02

As an Intern, I want to manage my profile so that Staff can access accurate information about me.

### US-I03

As an Intern, I want to upload my CV so that I can use it when applying.

### US-I04

As an Intern, I want to browse available programs so that I can choose an internship opportunity.

### US-I05

As an Intern, I want to apply to a program so that I can be considered for the internship.

### US-I06

As an Intern, I want to see my application status so that I know where I am in the selection process.

### US-I07

As an Intern, I want to see my interview information so that I know when and with whom my interview takes place.

### US-I08

As an Intern, I want to see my assigned mentor so that I know who is responsible for tracking my internship.

### US-I09

As an Intern, I want to see my tasks so that I know what work I need to complete.

### US-I10

As an Intern, I want to submit my work so that Staff can review it.

### US-I11

As an Intern, I want to see feedback so that I know what needs improvement.

### US-I12

As an Intern, I want to see my progress so that I understand how much of my internship I have completed.

---

## Staff Stories

### US-S01

As Staff, I want to create internship programs so that internship opportunities can be managed centrally.

### US-S02

As Staff, I want to publish programs so that applicants can apply.

### US-S03

As Staff, I want to review applications so that I can select suitable applicants.

### US-S04

As Staff, I want to shortlist applicants so that I can move suitable candidates to interviews.

### US-S05

As Staff, I want to schedule interviews so that applicants can be evaluated.

### US-S06

As Staff, I want to record interview results so that final application decisions can be made.

### US-S07

As Staff, I want to accept or reject applicants so that the application process can be completed.

### US-S08

As Staff, I want to assign interns to mentors so that every intern can have appropriate supervision.

### US-S09

As Staff, I want to see mentor workload so that assignments can be managed effectively.

### US-S10

As Staff, I want to create tasks so that interns have structured work.

### US-S11

As Staff, I want to assign tasks so that each intern knows their responsibilities.

### US-S12

As Staff, I want to review submissions so that I can validate intern work.

### US-S13

As Staff, I want to request changes so that interns can improve their submissions.

### US-S14

As Staff, I want to approve completed tasks so that progress can be measured.

### US-S15

As Staff, I want to monitor intern progress so that I can identify problems early.

### US-S16

As Staff, I want to view dashboards so that I can understand internship operations.

---

# 23. Acceptance Criteria

## Feature: Register/Login

* User can create/use an account according to the supported registration process.
* Valid credentials provide access.
* Invalid credentials do not provide access.
* Unauthorized users cannot access protected functionality.

---

## Feature: Apply to Internship

* Intern can apply to an OPEN program.
* Intern cannot apply twice to the same program.
* Application cannot be submitted after the program stops accepting applications.
* Application is created with status `APPLIED`.
* Intern can view the resulting application status.

---

## Feature: Review Application

* Authorized Staff can view applications.
* Staff can move an application from `APPLIED` to `UNDER_REVIEW`.
* Staff can shortlist an eligible application.
* Staff can reject an application according to valid transitions.
* Invalid status transitions are prevented.

---

## Feature: Interview

* Staff can create an interview for an eligible application.
* Staff can assign an interviewer.
* Staff can set date/time.
* Intern can view the interview information.
* Staff can reschedule.
* Staff can cancel.
* Staff can complete the interview and record a result.

---

## Feature: Accept Applicant

* Staff can accept an applicant through an allowed lifecycle transition.
* The application becomes `ACCEPTED`.
* The applicant becomes eligible for internship onboarding.
* The decision is historically recorded.

---

## Feature: Mentor Assignment

* Authorized Staff can assign a mentor.
* Intern can view their current mentor.
* Staff can view interns assigned to them.
* Previous assignments remain historically identifiable.
* Unauthorized Staff cannot modify assignments.

---

## Feature: Create Task

* Authorized Staff can create a task.
* Task has required information.
* Staff can assign it to an Intern.
* Intern can see the assigned task.
* Task initially has the appropriate initial status.

---

## Feature: Submit Task

* Assigned Intern can submit their task.
* Another Intern cannot submit it.
* Submission changes the task to `SUBMITTED`.
* Staff can view the submission.

---

## Feature: Review Task

* Authorized Staff can review a submitted task.
* Staff can provide feedback.
* Staff can approve the submission.
* Staff can request changes.
* Approved tasks cannot be accidentally returned to an earlier state.

---

## Feature: Resubmit Task

* Intern can resubmit a task after changes are requested.
* Task returns to the appropriate review flow.
* Previous submission information remains distinguishable if version history is required.

---

## Feature: Dashboard

### Intern

* Internship status is visible.
* Progress is visible.
* Tasks are summarized.
* Upcoming deadlines are visible.
* Recent feedback is visible.
* Mentor information is visible.

### Staff

* Intern counts are visible.
* Application information is visible.
* Upcoming interviews are visible.
* Mentor workload is visible.
* Task statistics are visible.
* Intern progress is visible.

---

# 24. MVP Scope

## MUST HAVE

### Authentication & Users

* [ ] Intern authentication.
* [ ] Staff authentication.
* [ ] Role-based access.
* [ ] Intern profile.
* [ ] Staff access control.

### Programs

* [ ] Create program.
* [ ] Edit program.
* [ ] Program requirements.
* [ ] Capacity.
* [ ] Application dates.
* [ ] Internship dates.
* [ ] Publish/open program.
* [ ] Close program.
* [ ] Complete program.
* [ ] Archive program.

### Applications

* [ ] Apply to program.
* [ ] Prevent duplicate applications.
* [ ] Application status.
* [ ] Application review.
* [ ] Shortlisting.
* [ ] Accept/reject.
* [ ] Application history.

### Interviews

* [ ] Create interview.
* [ ] Assign interviewer.
* [ ] Schedule.
* [ ] Reschedule.
* [ ] Cancel.
* [ ] Complete.
* [ ] Record result.

### Internships

* [ ] Accepted state.
* [ ] Onboarding state.
* [ ] Active state.
* [ ] Completed state.
* [ ] Dropped state.
* [ ] Internship progress.

### Mentor Tracking

* [ ] Assign Staff mentor.
* [ ] View assigned interns.
* [ ] Track mentor workload.
* [ ] Change mentor.
* [ ] Preserve assignment history.

### Tasks

* [ ] Create task.
* [ ] Assign task.
* [ ] Task description.
* [ ] Deadline.
* [ ] Priority.
* [ ] Status.
* [ ] Submit task.
* [ ] Review submission.
* [ ] Feedback.
* [ ] Approve.
* [ ] Request changes.
* [ ] Resubmit.

### Notifications

* [ ] Application notifications.
* [ ] Interview notifications.
* [ ] Task notifications.
* [ ] Review/feedback notifications.
* [ ] Mentor-assignment notifications.
* [ ] Internship-status notifications.

### Dashboards

* [ ] Intern dashboard.
* [ ] Staff dashboard.
* [ ] Required metrics.

### Search

* [ ] Application search/filter.
* [ ] Intern search/filter.
* [ ] Task search/filter.
* [ ] Sorting.
* [ ] Pagination.

### Files

* [ ] CV upload.
* [ ] Internship documents.
* [ ] Task submission files.
* [ ] Authorization for file access.

### History

* [ ] Application history.
* [ ] Mentor assignment history.
* [ ] Task status history.
* [ ] Submission/review history.
* [ ] Interview history.
* [ ] Internship status history.

---

# 25. Phase 2 / Future Features

The following may be implemented after the MVP:

* Advanced dashboard analytics.
* Advanced reporting.
* Exportable reports.
* More sophisticated workload management.
* Configurable notification preferences.
* Richer document versioning.
* Advanced task dependencies.
* Bulk operations.
* Advanced filtering.
* Automated reminders.
* Program templates.
* More advanced progress analytics.

---

# 26. Future / Optional Features

Explicitly outside the MVP unless business requirements change:

* Mentoring sessions.
* Video calls.
* Internal chat.
* AI applicant scoring.
* AI-generated evaluations.
* Attendance tracking.
* Payroll.
* Employee/HR management.
* Predictive analytics.
* External ATS integration.
* External HR integrations.

---

# 27. Mentor Guide

This BRD is intended to be used as the main reference for planning and reviewing intern work.

Mentors should not immediately convert the entire document into development tasks. Instead, the work should be progressively decomposed.

## Step 1 — Break Requirements Into Epics

Use the following suggested structure:

### Epic 1 — Authentication & Users

Covers:

* Authentication.
* Profiles.
* Roles.
* Permissions.

### Epic 2 — Internship Programs

Covers:

* Program creation.
* Program configuration.
* Publishing.
* Opening/closing.
* Capacity.
* Program lifecycle.

### Epic 3 — Applications

Covers:

* Application creation.
* Application review.
* Status transitions.
* Shortlisting.
* Acceptance/rejection.

### Epic 4 — Interviews

Covers:

* Interview creation.
* Scheduling.
* Interviewer assignment.
* Rescheduling.
* Cancellation.
* Results.

### Epic 5 — Intern & Mentor Tracking

Covers:

* Internship lifecycle.
* Mentor assignment.
* Workload.
* Intern progress.
* Assignment history.

### Epic 6 — Tasks & Submissions

Covers:

* Task creation.
* Assignment.
* Deadlines.
* Priorities.
* Submission.
* Review.
* Feedback.
* Approval.
* Changes requested.
* Resubmission.

### Epic 7 — Notifications

Covers:

* Application events.
* Interview events.
* Task events.
* Feedback events.
* Mentor assignment.
* Internship status.

### Epic 8 — Dashboards

Covers:

* Intern dashboard.
* Staff dashboard.
* Required statistics.
* Progress visibility.

### Epic 9 — Files & Documents

Covers:

* CVs.
* Internship documents.
* Submission files.
* Access rules.
* Version history where required.

### Epic 10 — Audit & History

Covers:

* Status history.
* Assignment history.
* Task history.
* Interview history.
* Internship history.

---

# 28. How Mentors Should Break Down Work

For each Epic:

**Epic → Feature → User Story → Task → Acceptance Criteria**

Example:

### Epic

Tasks & Submissions

### Feature

Task Submission

### User Story

> As an Intern, I want to submit my task so that Staff can review my work.

### Development Tasks

The mentor may then create implementation tasks such as:

* Build task list experience.
* Build task details experience.
* Implement submission workflow.
* Implement submission validation.
* Implement review workflow.
* Implement feedback workflow.
* Add authorization.
* Add tests.

The BRD defines **what** must happen.

The mentor and engineering team decide **how** it is implemented.

---

# 29. Dependencies

Mentors should identify dependencies before assigning work.

Examples:

### Applications depend on:

* Authentication.
* Programs.
* Intern profiles.

### Interviews depend on:

* Applications.
* Staff accounts.

### Internship tracking depends on:

* Accepted applications.

### Mentor assignment depends on:

* Staff accounts.
* Intern records.

### Tasks depend on:

* Active internships.
* Intern records.
* Staff/mentor assignments.

### Dashboards depend on:

* Applications.
* Internships.
* Tasks.
* Interviews.
* Mentor assignments.

### Notifications depend on:

* Events from the relevant business workflows.

---

# 30. Definition of Done

A feature should not be considered complete merely because the UI exists.

A feature should be considered Done when:

* The business requirement is implemented.
* Valid users can perform the intended action.
* Unauthorized users cannot perform the action.
* Required validations exist.
* Business rules are enforced.
* Relevant status transitions work.
* Relevant edge cases are handled.
* Acceptance criteria are satisfied.
* Appropriate error states exist.
* Relevant history is recorded.
* Relevant notifications work where required.
* The implementation has been code reviewed.
* The feature has been tested.
* The mentor has validated the behavior against this BRD.

---

# 31. Suggested Internship Development Sequence

A practical implementation sequence is:

## Phase 1 — Foundation

1. Authentication & users.
2. Profiles.
3. Permissions.

## Phase 2 — Programs

4. Program creation.
5. Program lifecycle.
6. Program requirements.
7. Program capacity.

## Phase 3 — Applications

8. Application creation.
9. Application review.
10. Application lifecycle.
11. Acceptance/rejection.

## Phase 4 — Interviews

12. Interview scheduling.
13. Interview management.
14. Interview results.

## Phase 5 — Internships

15. Internship lifecycle.
16. Mentor assignment.
17. Mentor workload.
18. Intern progress.

## Phase 6 — Tasks

19. Task creation.
20. Task assignment.
21. Task tracking.
22. Submission.
23. Review.
24. Feedback.
25. Approval/change requests.

## Phase 7 — Supporting Features

26. Notifications.
27. Files.
28. Dashboards.
29. Search/filtering.
30. Audit/history.

This sequence is a planning recommendation rather than a technical architecture requirement.

---

# 32. Business Decisions Required

The following decisions are intentionally unresolved because the original requirements do not specify them.

## BDR-01 — Multiple Mentors

Can an Intern have more than one active mentor?

**Decision:** ______________________

---

## BDR-02 — Mentor Capacity

Is there a maximum number of interns per mentor?

**Decision:** ______________________

---

## BDR-03 — Rejected Application Reconsideration

Can a rejected application be reopened?

**Decision:** ______________________

---

## BDR-04 — Interview Required for Acceptance

Must every accepted applicant complete an interview?

**Decision:** ______________________

---

## BDR-05 — Multiple Interviews

Can one application have multiple interviews?

**Decision:** ______________________

---

## BDR-06 — Program Capacity

What happens when program capacity is reached?

* Automatically close applications?
* Prevent further acceptance?
* Maintain a waiting list?

**Decision:** ______________________

---

## BDR-07 — Late Task Submission

Can an Intern submit a task after its deadline?

**Decision:** ______________________

---

## BDR-08 — Reopening Approved Tasks

Can an approved task be reopened?

**Decision:** ______________________

---

## BDR-09 — Internship Completion

What exactly is required for an Intern to become `COMPLETED`?

**Decision:** ______________________

---

## BDR-10 — Dropped Internship

Who can mark an Intern as `DROPPED`?

**Decision:** ______________________

---

## BDR-11 — Application Withdrawal

Should Interns be able to withdraw applications?

**Decision:** ______________________

---

## BDR-12 — Document Versioning

Which documents require version history?

**Decision:** ______________________

---

## BDR-13 — Document Deletion

Who can delete submitted documents?

**Decision:** ______________________

---

## BDR-14 — Staff Management

Can Staff create/remove/manage other Staff accounts?

**Decision:** ______________________

---

## BDR-15 — Staff Visibility

Can every Staff member see every Intern, or only assigned Interns?

**Decision:** ______________________

---

## BDR-16 — Deadline Notifications

How far before a task deadline should reminders be sent?

**Decision:** ______________________

---

## BDR-17 — Onboarding Completion

What conditions move an Intern from `ONBOARDING` to `ACTIVE`?

**Decision:** ______________________

---

## BDR-18 — Incomplete Tasks at Internship End

What happens to incomplete tasks when an internship reaches its end date?

**Decision:** ______________________

---

# 33. Final MVP Checklist

This checklist should be used by mentors as the final MVP acceptance baseline.

## Users & Access

* [ ] Intern authentication works.
* [ ] Staff authentication works.
* [ ] Permissions are enforced.
* [ ] Interns cannot access Staff functionality.
* [ ] Staff access respects assigned permissions.

## Programs

* [ ] Staff can create programs.
* [ ] Staff can edit programs.
* [ ] Staff can define requirements.
* [ ] Staff can define capacity.
* [ ] Staff can define application dates.
* [ ] Staff can define internship dates.
* [ ] Program lifecycle works.
* [ ] Archived programs cannot accept applications.

## Applications

* [ ] Intern can apply.
* [ ] Duplicate applications are prevented.
* [ ] Application status is visible.
* [ ] Staff can review applications.
* [ ] Staff can shortlist.
* [ ] Staff can reject.
* [ ] Staff can accept.
* [ ] Invalid status transitions are prevented.
* [ ] Application history is recorded.

## Interviews

* [ ] Staff can schedule interviews.
* [ ] Interviewer can be assigned.
* [ ] Intern can view interview information.
* [ ] Interviews can be rescheduled.
* [ ] Interviews can be cancelled.
* [ ] Interviews can be completed.
* [ ] Results can be recorded.
* [ ] Interview history is preserved.

## Internships

* [ ] Accepted applicants enter onboarding.
* [ ] Interns can become active.
* [ ] Interns can become completed.
* [ ] Interns can become dropped.
* [ ] Internship progress is visible.

## Mentors

* [ ] Staff can assign mentors.
* [ ] Intern can view mentor.
* [ ] Staff can view assigned interns.
* [ ] Staff workload is visible.
* [ ] Mentor changes are supported.
* [ ] Assignment history is preserved.
* [ ] No mentoring-session functionality is included.

## Tasks

* [ ] Staff can create tasks.
* [ ] Staff can assign tasks.
* [ ] Task deadlines exist.
* [ ] Task priorities exist.
* [ ] Intern can view tasks.
* [ ] Intern can submit tasks.
* [ ] Staff can review submissions.
* [ ] Staff can provide feedback.
* [ ] Staff can approve submissions.
* [ ] Staff can request changes.
* [ ] Intern can resubmit after changes.
* [ ] Task status lifecycle is enforced.

## Notifications

* [ ] Application status notifications work.
* [ ] Interview notifications work.
* [ ] Task assignment notifications work.
* [ ] Deadline notifications work according to the agreed rule.
* [ ] Review/feedback notifications work.
* [ ] Mentor assignment notifications work.
* [ ] Internship status notifications work.

## Dashboards

### Intern

* [ ] Internship status.
* [ ] Progress.
* [ ] Task statistics.
* [ ] Upcoming deadlines.
* [ ] Recent feedback.
* [ ] Mentor information.
* [ ] Interview information.

### Staff

* [ ] Total interns.
* [ ] Active interns.
* [ ] Completed interns.
* [ ] Applications.
* [ ] Application statuses.
* [ ] Upcoming interviews.
* [ ] Mentor workload.
* [ ] Task statistics.
* [ ] Intern progress.

## Search

* [ ] Application search/filter.
* [ ] Intern search/filter.
* [ ] Task search/filter.
* [ ] Sorting.
* [ ] Pagination.

## Files

* [ ] CV upload.
* [ ] CV access control.
* [ ] Internship document upload.
* [ ] Internship document access control.
* [ ] Task submission files.
* [ ] Submission file access control.

## Audit

* [ ] Application status history.
* [ ] Mentor assignment history.
* [ ] Task status history.
* [ ] Submission/review history.
* [ ] Interview history.
* [ ] Internship status history.

## Quality

* [ ] Acceptance criteria pass.
* [ ] Business rules pass.
* [ ] Authorization has been tested.
* [ ] Edge cases have been tested.
* [ ] Error handling exists.
* [ ] Responsive behavior has been tested.
* [ ] Code has been reviewed.
* [ ] Mentor has validated the completed functionality.

---

# 34. Final Product Definition

The MVP is complete when the platform can manage the internship journey end-to-end:

**Program Creation**

→ **Program Opens**

→ **Intern Applies**

→ **Application Review**

→ **Shortlisting**

→ **Interview**

→ **Acceptance / Rejection**

→ **Onboarding**

→ **Active Internship**

→ **Mentor Assignment**

→ **Task Assignment**

→ **Task Submission**

→ **Review & Feedback**

→ **Approval / Changes**

→ **Progress Tracking**

→ **Internship Completion / Drop**

while providing the necessary:

* Notifications
* Dashboards
* Search/filtering
* Documents
* Permissions
* Audit/history

The BRD defines the expected business behavior. Mentors should use the acceptance criteria and business rules as the final reference when reviewing implementation.

Where this document explicitly says **BUSINESS DECISION REQUIRED**, mentors should resolve the decision before assigning implementation work that depends on it.
