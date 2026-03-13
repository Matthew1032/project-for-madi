export default function AuthBanner({ auth, onLogout }) {
  return (
    <div className="auth-banner">
      <div className="auth-status">
        <span className={`auth-dot ${auth.isAuthenticated ? 'connected' : ''}`} />
        {auth.isAuthenticated ? (
          <span>
            Connected as <span className="auth-name">{auth.userName || auth.email}</span>
          </span>
        ) : (
          <span>Not connected to Microsoft</span>
        )}
      </div>

      {auth.isAuthenticated ? (
        <button className="btn btn-ghost" onClick={onLogout}>
          Sign out
        </button>
      ) : (
        <a className="btn btn-secondary" href="/auth/login">
          Connect Microsoft
        </a>
      )}
    </div>
  );
}
