Review the current codebase state for the described area. Check for:

1. **Dead code** — unused imports, unreachable functions, mock data that should be real
2. **Integration gaps** — data layers not connected to UI, handlers not wired up
3. **Build health** — does it build? Any warnings?
4. **Consistency** — naming conventions, file organization, duplicate logic
5. **Security** — exposed API keys, injection risks, missing validation at boundaries

Report findings as a prioritized list: critical > important > nice-to-have.

Area to review: $ARGUMENTS
