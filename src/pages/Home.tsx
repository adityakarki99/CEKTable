import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home">
      <div className="home-container">
        <div className="logo-badge">
          <span className="logo-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="3" y="3" width="7" height="7" rx="1" fill="currentColor"/>
              <rect x="14" y="3" width="7" height="7" rx="1" fill="currentColor" opacity="0.6"/>
              <rect x="3" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.6"/>
              <rect x="14" y="14" width="7" height="7" rx="1" fill="currentColor" opacity="0.3"/>
            </svg>
          </span>
          <span>CEK Table</span>
        </div>
        <h1>Build powerful data tables</h1>
        <p className="subtitle">
          A modern, Clay-inspired table component built with TanStack Table.
          <br />
          Perfect for inventory management and data-heavy applications.
        </p>

        <div className="nav-cards">
          <Link to="/demo" className="nav-card">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Table Demo</h2>
            <p>Test the table with sample inventory data. Try sorting, filtering, pagination, and row selection.</p>
            <span className="card-link">Explore demo &rarr;</span>
          </Link>

          <Link to="/components" className="nav-card">
            <div className="card-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M3 9H21" stroke="currentColor" strokeWidth="2"/>
                <path d="M9 21V9" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </div>
            <h2>Table Components</h2>
            <p>View individual components and styling. See status badges, buttons, inputs, and the color palette.</p>
            <span className="card-link">View components &rarr;</span>
          </Link>
        </div>

        <div className="features">
          <div className="feature">
            <span className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6H21M3 12H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Sorting</span>
          </div>
          <div className="feature">
            <span className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Filtering</span>
          </div>
          <div className="feature">
            <span className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 12H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Pagination</span>
          </div>
          <div className="feature">
            <span className="feature-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 11L12 14L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V5C3 3.89543 3.89543 3 5 3H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span>Selection</span>
          </div>
        </div>
      </div>

      <style>{`
        .home {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 2rem;
        }

        .home-container {
          text-align: center;
          max-width: 800px;
        }

        .logo-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 600;
          color: #8b5cf6;
          margin-bottom: 1.5rem;
        }

        .logo-icon {
          display: flex;
          align-items: center;
        }

        h1 {
          font-size: 2.75rem;
          font-weight: 700;
          margin-bottom: 1rem;
          background: linear-gradient(135deg, #1e293b 0%, #475569 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          font-size: 1.125rem;
          line-height: 1.7;
          margin-bottom: 3rem;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .nav-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .nav-card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
          padding: 1.75rem;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          text-decoration: none;
          color: inherit;
          transition: all 0.2s ease;
          box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.04),
            0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .nav-card:hover {
          transform: translateY(-2px);
          border-color: #c4b5fd;
          box-shadow:
            0 4px 6px rgba(139, 92, 246, 0.08),
            0 12px 24px rgba(139, 92, 246, 0.12);
        }

        .card-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          border-radius: 12px;
          color: white;
          margin-bottom: 1rem;
        }

        .nav-card h2 {
          font-size: 1.25rem;
          margin-bottom: 0.5rem;
        }

        .nav-card p {
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 1rem;
          flex-grow: 1;
        }

        .card-link {
          font-size: 0.875rem;
          font-weight: 600;
          color: #8b5cf6;
        }

        .nav-card:hover .card-link {
          color: #7c3aed;
        }

        .features {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .feature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 1rem;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 100px;
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
        }

        .feature-icon {
          display: flex;
          align-items: center;
          color: #8b5cf6;
        }

        /* Dark mode */
        @media (prefers-color-scheme: dark) {
          h1 {
            background: linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }

          .logo-badge {
            background: rgba(139, 92, 246, 0.15);
            border-color: rgba(139, 92, 246, 0.25);
            color: #a78bfa;
          }

          .nav-card {
            background: #1e293b;
            border-color: #334155;
            box-shadow:
              0 1px 3px rgba(0, 0, 0, 0.2),
              0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .nav-card:hover {
            border-color: #7c3aed;
            box-shadow:
              0 4px 6px rgba(139, 92, 246, 0.15),
              0 12px 24px rgba(139, 92, 246, 0.2);
          }

          .nav-card h2 {
            color: #f1f5f9;
          }

          .card-link {
            color: #a78bfa;
          }

          .nav-card:hover .card-link {
            color: #c4b5fd;
          }

          .feature {
            background: #1e293b;
            border-color: #334155;
            color: #cbd5e1;
          }

          .feature-icon {
            color: #a78bfa;
          }
        }
      `}</style>
    </div>
  )
}

export default Home
