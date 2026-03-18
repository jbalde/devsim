# Agent Roles

## Management Roles

These agents coordinate work rather than execute tasks directly.

### Product Manager
- **Cost:** $5/tick
- **Skills:** roadmap, user-stories, prioritization, stakeholder-mgmt
- **Behavior:** Assigns tasks to available workers, broadcasts status updates

### Project Manager
- **Cost:** $4/tick
- **Skills:** planning, coordination, risk-mgmt, reporting
- **Behavior:** Assigns tasks to available workers, checks team progress

## Worker Roles

These agents execute tasks assigned by managers.

### Frontend Developer
- **Cost:** $3/tick
- **Skills:** react, css, accessibility, performance

### Backend Developer
- **Cost:** $3/tick
- **Skills:** api-design, databases, microservices, caching

### Fullstack Developer
- **Cost:** $4/tick
- **Skills:** react, api-design, databases, deployment

### BI Analyst
- **Cost:** $3/tick
- **Skills:** sql, dashboards, data-modeling, reporting

### Security Engineer
- **Cost:** $4/tick
- **Skills:** pen-testing, code-review, auth, compliance

### QA Engineer
- **Cost:** $2/tick
- **Skills:** test-automation, manual-testing, bug-reporting, regression

### DevOps Engineer
- **Cost:** $4/tick
- **Skills:** docker, ci-cd, monitoring, cloud

### UX Designer
- **Cost:** $3/tick
- **Skills:** wireframing, prototyping, user-research, design-systems

## Agent States

| Status    | Description                          |
|-----------|--------------------------------------|
| `idle`    | No task assigned, available for work |
| `working` | Actively working on a task           |
| `talking` | Communicating with another agent     |
| `blocked` | Waiting on a dependency or review    |
| `offline` | Not active                           |

## Communication

Agents communicate via messages that are visible in the Office Chat:
- **Direct messages:** Agent → Agent (task assignments, review requests)
- **Broadcasts:** Agent → All (status updates, availability)
- **System messages:** Hire/fire notifications
