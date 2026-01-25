import { Link } from 'react-router-dom'

function Home() {
  return (
    <div className="home">
      <div className="home-container">
        <h1>CEK Table</h1>
        <p className="subtitle">A reusable TanStack Table component for inventory management</p>

        <div className="nav-cards">
          <Link to="/demo" className="nav-card">
            <div className="card-icon">&#9881;</div>
            <h2>Table Demo</h2>
            <p>Test the table with sample inventory data. Explore sorting, filtering, pagination, and row selection.</p>
          </Link>

          <Link to="/components" className="nav-card">
            <div className="card-icon">&#9635;</div>
            <h2>Table Components</h2>
            <p>View individual table components and styling options. See how each piece works.</p>
          </Link>
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

        .subtitle {
          color: #888;
          font-size: 1.2em;
          margin-bottom: 3rem;
        }

        .nav-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 2rem;
        }

        .nav-card {
          display: block;
          padding: 2rem;
          background: linear-gradient(135deg, #1e1e3f 0%, #2a2a4a 100%);
          border-radius: 16px;
          border: 1px solid #3a3a5a;
          text-decoration: none;
          color: inherit;
          transition: all 0.3s ease;
        }

        .nav-card:hover {
          transform: translateY(-4px);
          border-color: #646cff;
          box-shadow: 0 8px 30px rgba(100, 108, 255, 0.2);
        }

        .card-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .nav-card h2 {
          color: #fff;
          margin-bottom: 0.5rem;
        }

        .nav-card p {
          color: #aaa;
          font-size: 0.95em;
          line-height: 1.6;
        }

        @media (prefers-color-scheme: light) {
          .nav-card {
            background: linear-gradient(135deg, #fff 0%, #f8f8ff 100%);
            border-color: #ddd;
          }

          .nav-card:hover {
            box-shadow: 0 8px 30px rgba(100, 108, 255, 0.15);
          }

          .nav-card h2 {
            color: #333;
          }

          .nav-card p {
            color: #666;
          }
        }
      `}</style>
    </div>
  )
}

export default Home
