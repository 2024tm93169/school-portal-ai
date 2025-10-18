# AI Usage Log (Representative)

**Tool:** Anthropic Claude (conversational), GitHub Copilot (inline)

1. Prompt: “Add secure password hashing to Flask signup/login.”  
   - Output: Use `werkzeug.security` → `generate_password_hash`, `check_password_hash`.
2. Prompt: “Validate numeric fields for equipment total_quantity.”  
   - Output: Try/except and non-negative checks, return 400 with clear messages.
3. Prompt: “Improve UX for request submission feedback in React.”  
   - Output: Inline success/error state instead of `alert()`.
4. Prompt: “Refactor repeating request status updates.”  
   - Output: Consolidate into helper with branches for APPROVED/REJECTED/RETURNED.
