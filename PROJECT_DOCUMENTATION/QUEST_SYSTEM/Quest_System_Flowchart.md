# Quest System Flowchart

## Complete Quest Lifecycle Flow

```mermaid
flowchart TD
    A[Quest Creator Creates Quest] --> B{Quest Status}
    B --> C[draft]
    B --> D[open]
    
    C --> E[Creator Edits Quest]
    E --> F[Creator Publishes Quest]
    F --> D
    
    D --> G[Users Browse Available Quests]
    G --> H[User Applies to Quest]
    
    H --> I[Application Created]
    I --> J{Creator Reviews Application}
    
    J --> K[Approve Application]
    J --> L[Reject Application]
    
    K --> M[QuestParticipant Created]
    K --> N[Quest Status → in-progress]
    K --> O[Other Applications Auto-Rejected]
    
    L --> P[Application Status → rejected]
    P --> Q[User Can Apply Again]
    Q --> H
    
    M --> R[Participant Works on Quest]
    R --> S[Participant Submits Work]
    
    S --> T[QuestSubmission Created]
    T --> U{Creator Reviews Submission}
    
    U --> V[Approve Submission]
    U --> W[Needs Revision]
    U --> X[Reject Submission]
    
    V --> Y[Participant Status → completed]
    V --> Z[Quest Status → completed]
    V --> AA[Rewards Distributed]
    AA --> AB[XP + Gold Added]
    AA --> AC[Transaction Records Created]
    
    W --> AD[Submission Status → needs_revision]
    AD --> AE[Participant Can Resubmit]
    AE --> S
    
    X --> AF[Submission Status → rejected]
    X --> AG[Application Attempts Reset]
    AG --> AH[Participant Removed]
    AH --> AI[Quest Status → open]
    AI --> G
    
    Z --> AJ[Quest Complete - Success]
    
    style A fill:#e1f5fe
    style D fill:#f3e5f5
    style M fill:#e8f5e8
    style Y fill:#fff3e0
    style Z fill:#e8f5e8
    style AA fill:#fff9c4
    style AJ fill:#c8e6c9
```

## Quest Application Process

```mermaid
flowchart TD
    A[User Views Quest] --> B{User Can Apply?}
    
    B --> C[✅ Eligible]
    B --> D[❌ Not Eligible]
    
    C --> E[Click Apply Button]
    D --> F[Show Restriction Message]
    
    F --> G[Cannot Apply - End]
    
    E --> H[Application Created<br/>Status: pending]
    H --> I[Creator Notification]
    
    I --> J{Creator Action}
    J --> K[Approve]
    J --> L[Reject]
    J --> M[No Action - Stays Pending]
    
    K --> N[Atomic Transaction Begins]
    N --> O[Application Status → approved]
    O --> P[Create QuestParticipant]
    P --> Q[Quest Status → in-progress]
    Q --> R[Quest assigned_to → user]
    R --> S[Auto-reject Other Applications]
    S --> T[Transaction Commit]
    T --> U[User Becomes Participant]
    
    L --> V[Application Status → rejected]
    V --> W[User Can Reapply]
    
    N --> X{Transaction Fails?}
    X --> Y[Rollback All Changes]
    Y --> Z[Application Stays Pending]
    Z --> AA[Error Logged]
    
    style C fill:#c8e6c9
    style D fill:#ffcdd2
    style K fill:#e8f5e8
    style L fill:#ffcdd2
    style U fill:#c8e6c9
    style Y fill:#ffcdd2
```

## Quest Submission & Review Process

```mermaid
flowchart TD
    A[Participant Working on Quest] --> B[Submit Work]
    
    B --> C[QuestSubmission Created<br/>Status: pending]
    C --> D[Creator Notification]
    
    D --> E{Creator Reviews Submission}
    
    E --> F[Approve ✅]
    E --> G[Needs Revision ⚠️]
    E --> H[Reject ❌]
    
    F --> I[Submission Status → approved]
    I --> J[Participant Status → completed]
    J --> K[Quest Status → completed]
    K --> L[Distribute Rewards]
    L --> M[Add XP to User]
    M --> N[Add Gold to User]
    N --> O[Create Transaction Records]
    O --> P[Update Application to Approved]
    P --> Q[✅ Quest Successfully Completed]
    
    G --> R[Submission Status → needs_revision]
    R --> S[Participant Remains in_progress]
    S --> T[Participant Can Resubmit]
    T --> B
    
    H --> U[Submission Status → rejected]
    U --> V[Reset Application Attempts to 0]
    V --> W[Remove QuestParticipant]
    W --> X[Quest Status → open]
    X --> Y[Quest Available for Others]
    Y --> Z[User Can Apply Fresh]
    
    style F fill:#c8e6c9
    style G fill:#fff3e0
    style H fill:#ffcdd2
    style Q fill:#4caf50
    style T fill:#fff3e0
    style Z fill:#e3f2fd
```

## Payment & Gold System Integration

```mermaid
flowchart TD
    A[User Wants Gold] --> B[Select Gold Package]
    B --> C[Generate QR Code]
    C --> D[User Pays via GCash]
    D --> E[User Uploads Receipt]
    
    E --> F[Payment Status: queued]
    F --> G[Assigned to Batch]
    G --> H{Batch Processing Time}
    
    H --> I[Admin Reviews Batch]
    I --> J{Payment Verification}
    
    J --> K[✅ Verified]
    J --> L[❌ Rejected]
    
    K --> M[Payment Status: verified]
    M --> N[Add Gold to User Account]
    N --> O[Create Transaction Record]
    O --> P[Payment Status: completed]
    
    L --> Q[Payment Status: rejected]
    Q --> R[User Can Resubmit]
    
    P --> S[User Can Use Gold for:]
    S --> T[Creating Quests<br/>(Quest Rewards)]
    S --> U[Cashout to Real Money]
    
    T --> V[Quest Created with Gold Rewards]
    V --> W[Participants Complete Quest]
    W --> X[Gold Transferred from Creator to Participant]
    
    U --> Y[Cashout Request]
    Y --> Z[KYC Verification]
    Z --> AA[Admin Approval]
    AA --> BB[Real Money Transfer]
    BB --> CC[Gold Deducted from Account]
    
    style K fill:#c8e6c9
    style L fill:#ffcdd2
    style P fill:#4caf50
    style X fill:#fff9c4
    style BB fill:#e8f5e8
```

## Quest Status State Machine

```mermaid
stateDiagram-v2
    [*] --> draft : Creator creates quest
    draft --> draft : Creator edits
    draft --> open : Creator publishes
    
    open --> in_progress : Application approved
    in_progress --> completed : Submission approved
    in_progress --> open : Submission rejected
    
    completed --> [*] : Quest finished
    
    note right of open : Multiple users can apply
    note right of in_progress : Only one participant active
    note right of completed : Rewards distributed
```

## Key System Components

### 1. **Quest Management**
- **Creation**: Draft → Open → In-Progress → Completed
- **Applications**: User applies → Creator reviews → Approve/Reject
- **Restrictions**: XP requirements, Gold requirements, Max attempts

### 2. **Submission System**
- **Independent Submissions**: Each submission reviewed separately
- **Three Review Actions**: Approve, Needs Revision, Reject
- **Attempt Management**: Reset on rejection, preserve on revision

### 3. **Reward Distribution**
- **Automatic**: Triggered on submission approval
- **XP Rewards**: Added to user profile
- **Gold Rewards**: Transferred from creator to participant
- **Transaction Logging**: All transfers recorded

### 4. **Security Features**
- **Atomic Transactions**: All-or-nothing application approval
- **Permission Checks**: Only quest creators can review
- **Attempt Limits**: Prevent spam applications
- **KYC Requirements**: For large cashouts

### 5. **Payment Integration**
- **Batch Processing**: Efficient payment verification
- **Multiple Methods**: GCash, PayMaya, Bank transfers
- **Commission Tracking**: Fee calculation and storage
- **Real-time Status**: Users track payment progress

## Business Logic Rules

### Quest Application Rules:
1. User must meet XP requirements
2. User must have sufficient gold (if required)
3. User cannot exceed max attempts
4. Only one participant per quest
5. Creator cannot apply to own quest

### Submission Review Rules:
1. Only quest creators can review submissions
2. Only pending submissions can be reviewed
3. Approval completes the quest immediately
4. Rejection resets all attempts for fresh start
5. Needs revision preserves progress

### Reward Distribution Rules:
1. Rewards only distributed on submission approval
2. Gold transferred from creator to participant
3. XP added directly to participant account
4. Commission fees deducted from transactions
5. All transfers create audit trail

### Payment Processing Rules:
1. All payments queued in batches
2. Small amounts (≤₱70) auto-approved
3. Large amounts require manual verification
4. KYC required for cashouts >₱500
5. Commission rates apply to all transactions

## Error Handling & Recovery

### Application Approval Failures:
- Automatic rollback of all changes
- Application status reverted to pending
- Detailed error logging
- User notified of system error

### Payment Processing Failures:
- Batch processing can be retried
- Individual payments can be re-verified
- Failed payments marked for manual review
- Users notified of status changes

### Data Consistency:
- Database constraints prevent orphaned records
- Foreign key relationships enforced
- Transaction atomicity guaranteed
- Audit trails for all critical operations
