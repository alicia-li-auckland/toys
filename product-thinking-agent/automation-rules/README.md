# Automation Rules - Progressive Trust System

This directory defines how the Product Thinking Agent handles automation and builds trust with users over time.

## Philosophy

The agent should:
1. **Start cautious**: Ask before doing anything that modifies state
2. **Learn patterns**: Notice when user consistently approves certain actions
3. **Offer automation**: Suggest auto-executing repeated, approved actions
4. **Stay transparent**: Always show what was done, offer undo
5. **Respect revocation**: Let user disable auto-execution anytime

## Three Tiers of Actions

### 🟢 Safe Actions (Always Auto-Execute)

**File:** `safe-actions.json`

Read-only operations that help gather context:
- Reading files
- Listing directories
- Parsing data to understand structure
- Analyzing data (read-only)
- Loading knowledge resources

**Why safe:** No modifications, reversible, helps informed decision-making

**Example:**
```
User: "What's in this XER file?"
Agent: [Reads file, parses structure, shows summary]
       (No permission needed - read-only)
```

---

### 🟡 Ask-First Actions (Require Permission)

**File:** `ask-first-actions.json`

Operations that modify state or take significant time/resources:
- Writing/modifying files
- Data transformations (matching, filtering)
- Generating exports (PDF, CSV)
- External API calls
- Long-running operations

**Why ask:** Permanent changes, affects user's work, may have costs

**Example:**
```
User: "Match these datasets"
Agent: "I'll match schedule to actual data using hybrid strategy.
        This will process 5,000 rows and may take 2-3 seconds.
        Continue? [Yes] [No] [Options]"
User: "Yes"
Agent: [Executes matching]
```

---

### 🟣 Learned Actions (Auto-Execute with Trust)

**File:** `learned-actions.json`

Actions that were "ask-first" but user has consistently approved them:
- After 3+ approvals with similar parameters
- User explicitly opts into auto-execution
- Still shows what was done, offers undo

**Why learn:** Speeds up repetitive workflows while maintaining transparency

**Example:**
```
[After user approves matching 3 times]

Agent: "I've noticed you always approve hybrid matching with 80% threshold.
        Should I auto-execute this going forward? You can change this later.
        [Yes, auto-execute] [No, keep asking]"
        
User: "Yes, auto-execute"

[Next time]
Agent: "Running hybrid matching (auto-approved)... ✓ Done.
        Matched 450/500 rows (90%). [View Details] [Undo]"
```

## Learning Process

### 1. Tracking Approvals

```javascript
// Track each user decision
{
  "action_type": "match_datasets",
  "timestamp": "2024-12-01T10:00:00Z",
  "parameters": { "strategy": "hybrid", "threshold": 0.8 },
  "user_response": "approved",
  "execution_time_ms": 1500
}
```

### 2. Identifying Patterns

After 3+ consistent approvals:
- Same action type
- Similar parameters (±20% variation)
- No recent rejections
- Parameters within expected ranges

### 3. Proposing Auto-Execution

```
Agent: "I've noticed a pattern:
        • You've approved 'match_datasets' 4 times
        • Always with hybrid strategy
        • Threshold around 80%
        
        Should I auto-execute this going forward?
        [Yes] [No] [Customize]"
```

### 4. Auto-Executing with Transparency

```
Agent: "Running hybrid matching (auto-approved)..."
       [Shows progress if slow]
       "✓ Complete. Matched 450/500 rows (90%).
       [View Details] [Undo] [Stop auto-execution]"
```

## User Controls

### View Learned Actions

```
User: "Show my auto-approved actions"
Agent: "You have 3 actions set to auto-execute:
        
        1. Hybrid dataset matching (threshold 80%)
           • Learned: Dec 1, 2024
           • Executed: 5 times
           • [Revoke] [Adjust]
        
        2. Anomaly detection (all detectors)
           • Learned: Dec 1, 2024
           • Executed: 3 times
           • [Revoke] [Adjust]
        
        3. CSV export (with filters)
           • Learned: Dec 1, 2024
           • Executed: 4 times
           • [Revoke] [Adjust]"
```

### Revoke Auto-Execution

```
User: "Stop auto-executing matching"
Agent: "✓ I'll now ask before matching datasets.
       You can re-enable this later if you want."
```

### Adjust Parameters

```
User: "Change matching threshold to 85%"
Agent: "✓ Updated. I'll auto-match with 85% threshold going forward.
       (This counts as a new learned action, will ask 3 times to confirm new threshold)"
```

## Safety Guarantees

### Never Auto-Execute:
❌ File deletion
❌ Overwriting existing data
❌ External API calls with side effects
❌ Sending emails or messages
❌ Any destructive operations

### Always Provide:
✅ Pre-notification (what's about to happen)
✅ Post-summary (what was done)
✅ Undo option (when possible)
✅ Stop auto-execution link
✅ Audit trail (log of all actions)

## Implementation Notes

### Checking if Action Should Auto-Execute

```javascript
function shouldAutoExecute(actionType, parameters) {
  const learnedAction = getLearnedAction(actionType);
  
  if (!learnedAction) return false; // Not learned yet
  if (!learnedAction.auto_execution_approved) return false; // User hasn't opted in
  
  // Check if parameters are similar to learned pattern
  const similarity = calculateParameterSimilarity(
    parameters,
    learnedAction.typical_parameters
  );
  
  return similarity >= 0.8; // 80% similar
}
```

### Proposing Auto-Execution

```javascript
function checkForLearningOpportunity(actionType, approvalHistory) {
  const recentApprovals = approvalHistory
    .filter(h => h.action_type === actionType)
    .filter(h => h.timestamp > Date.now() - 30*24*60*60*1000) // Last 30 days
    .filter(h => h.user_response === 'approved');
  
  if (recentApprovals.length >= 3) {
    const rejections = approvalHistory
      .filter(h => h.action_type === actionType)
      .filter(h => h.user_response === 'rejected');
    
    if (rejections.length === 0) {
      return {
        shouldPropose: true,
        approvalCount: recentApprovals.length,
        typicalParameters: extractTypicalParameters(recentApprovals)
      };
    }
  }
  
  return { shouldPropose: false };
}
```

### Executing with Transparency

```javascript
async function executeLearnedAction(actionType, parameters) {
  // Pre-notification
  console.log(`Running ${actionType} (auto-approved)...`);
  
  // Execute
  const startTime = Date.now();
  const result = await performAction(actionType, parameters);
  const duration = Date.now() - startTime;
  
  // Log for audit
  logAction({
    actionType,
    parameters,
    result,
    duration,
    autoExecuted: true,
    timestamp: new Date().toISOString()
  });
  
  // Post-summary
  console.log(`✓ ${actionType} complete in ${duration}ms`);
  console.log(formatResultSummary(result));
  console.log('[View Details] [Undo] [Stop auto-execution]');
  
  return result;
}
```

## Future Enhancements

- [ ] Machine learning for parameter pattern recognition
- [ ] Context-aware automation (auto-execute in certain contexts only)
- [ ] Shared learned actions across team (with privacy controls)
- [ ] Confidence scores for learned patterns
- [ ] Automatic detection of changed patterns (parameters drift)
- [ ] A/B testing of automation thresholds

## Usage Example: Complete Flow

```
Session 1:
User: "Match this data"
Agent: "I'll match schedule to actual using hybrid strategy. OK?"
User: "Yes"
Agent: [Matches] "✓ Done. 450/500 matched."

Session 2:
User: "Match this new data"
Agent: "I'll match schedule to actual using hybrid strategy. OK?"
User: "Yes"
Agent: [Matches] "✓ Done. 380/420 matched."

Session 3:
User: "Match this data too"
Agent: "I'll match schedule to actual using hybrid strategy. OK?"
User: "Yes"
Agent: [Matches] "✓ Done. 510/550 matched."
       
       "I've noticed you always approve hybrid matching at 80% threshold.
       Should I auto-execute this going forward?
       [Yes, auto-execute] [No, keep asking]"
User: "Yes, auto-execute"
Agent: "✓ Got it. I'll auto-match from now on. You can stop this anytime."

Session 4:
User: "Match this schedule"
Agent: "Running hybrid matching (auto-approved)...
       ✓ Matched 420/450 rows (93%).
       [View Details] [Undo] [Stop auto-execution]"
```

---

**Remember:** The goal is to **speed up workflows** while maintaining **user control** and **transparency**. Never surprise the user with unexpected automation.

