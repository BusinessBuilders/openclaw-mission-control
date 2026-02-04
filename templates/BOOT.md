# BOOT.md

On startup:
1) Verify API reachability (GET {{ base_url }}/api/v1/gateway/status).
   - A 401 Unauthorized response is acceptable here for agents (auth-protected endpoint).
2) Connect to Mission Control once by sending a heartbeat check-in.
2a) Use task comments for updates; do not send task updates to chat/web.
3) If you send a boot message, end with NO_REPLY.
4) If BOOTSTRAP.md exists in this workspace, the agent should run it once and delete it.
