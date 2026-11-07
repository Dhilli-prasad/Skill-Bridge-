from typing import TypedDict


class ProjectItem(TypedDict, total=False):
    PK: str
    SK: str
    id: str
    title: str
    description: str
    fullDescription: str
    goals: list[str]
    outcomes: list[str]
    ownerId: str
    technology: list[str]
    category: str
    difficulty: str
    requiredRoles: list[str]
    capacity: int
    memberCount: int
    status: str
    visibility: str
    repositoryUrl: str
    createdAt: str
    updatedAt: str
    GSI1PK: str
    GSI1SK: str


class JoinRequestItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    id: str
    projectId: str
    requesterId: str
    role: str
    status: str
    createdAt: str
    updatedAt: str
    GSI1PK: str
    GSI1SK: str


class InvitationItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    id: str
    projectId: str
    inviteeId: str
    role: str
    status: str
    createdAt: str
    updatedAt: str
    GSI1PK: str
    GSI1SK: str


class MembershipItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    projectId: str
    userId: str
    role: str
    joinedAt: str


class MilestoneItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    milestoneId: str
    projectId: str
    title: str
    description: str
    order: int
    status: str
    startDate: str
    dueDate: str
    createdBy: str
    createdAt: str
    updatedAt: str


class TaskItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    taskId: str
    projectId: str
    milestoneId: str
    title: str
    description: str
    assigneeId: str
    status: str
    priority: str
    dueDate: str
    createdBy: str
    createdAt: str
    updatedAt: str


class ActivityItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    activityId: str
    projectId: str
    type: str
    actorId: str
    createdAt: str
    taskId: str
    milestoneId: str
    joinRequestId: str
    invitationId: str


class CompletionItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    projectId: str
    status: str
    submittedBy: str
    submittedAt: str
    completedAt: str
    rejectedAt: str
    rejectionReason: str
    progressSnapshot: dict[str, object]
    teamSnapshot: list[dict[str, object]]


class ConfirmationItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    projectId: str
    userId: str
    status: str
    reason: str
    createdAt: str


class ContributionItem(TypedDict, total=False):
    PK: str
    SK: str
    entityType: str
    contributionId: str
    projectId: str
    userId: str
    verifiedCompletion: bool
    completedTaskIds: list[str]
    completedTaskCount: int
    completionTimestamp: str
    GSI1PK: str
    GSI1SK: str
