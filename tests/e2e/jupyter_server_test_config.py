"""JupyterLab server configuration for E2E tests."""

c = get_config()  # noqa: F821

c.ServerApp.token = ""
c.ServerApp.disable_check_xsrf = True
c.ServerApp.open_browser = False
c.ServerApp.port = 8888
