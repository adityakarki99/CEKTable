import { Link } from 'react-router-dom'

function TableComponents() {
  return (
    <div className="page">
      <div className="page-header">
        <Link to="/" className="back-link">&larr; Back</Link>
        <h1>Table Components</h1>
        <p>View individual table components and styling options.</p>
      </div>

      <div className="components-grid">
        {/* Status Badges */}
        <section className="component-section">
          <h2>Status Badges</h2>
          <p className="section-desc">Visual indicators for inventory status</p>
          <div className="component-demo">
            <span className="status-badge in-stock">In Stock</span>
            <span className="status-badge low-stock">Low Stock</span>
            <span className="status-badge out-of-stock">Out of Stock</span>
          </div>
          <div className="code-block">
            <code>{`<span className="status-badge in-stock">In Stock</span>
<span className="status-badge low-stock">Low Stock</span>
<span className="status-badge out-of-stock">Out of Stock</span>`}</code>
          </div>
        </section>

        {/* Buttons */}
        <section className="component-section">
          <h2>Pagination Buttons</h2>
          <p className="section-desc">Navigation controls for paged data</p>
          <div className="component-demo">
            <button>{'<<'}</button>
            <button>{'<'}</button>
            <span style={{ margin: '0 0.5rem', color: '#888' }}>Page 1 of 5</span>
            <button>{'>'}</button>
            <button>{'>>'}</button>
          </div>
        </section>

        {/* Input Fields */}
        <section className="component-section">
          <h2>Filter Input</h2>
          <p className="section-desc">Global search across all columns</p>
          <div className="component-demo">
            <input
              type="text"
              placeholder="Search all columns..."
              className="global-filter"
              style={{ minWidth: '250px' }}
            />
          </div>
        </section>

        {/* Checkboxes */}
        <section className="component-section">
          <h2>Row Selection</h2>
          <p className="section-desc">Checkboxes for selecting rows</p>
          <div className="component-demo">
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" className="row-checkbox" />
              <span>Unselected row</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" className="row-checkbox" defaultChecked />
              <span>Selected row</span>
            </label>
          </div>
        </section>

        {/* Table Header */}
        <section className="component-section">
          <h2>Table Header</h2>
          <p className="section-desc">Sortable column headers with indicators</p>
          <div className="component-demo">
            <div className="demo-table-header">
              <div className="demo-th">SKU</div>
              <div className="demo-th sortable">
                Name <span className="sort-indicator">↑</span>
              </div>
              <div className="demo-th sortable">
                Qty <span className="sort-indicator">↓</span>
              </div>
              <div className="demo-th">Status</div>
            </div>
          </div>
        </section>

        {/* Table Row */}
        <section className="component-section">
          <h2>Table Rows</h2>
          <p className="section-desc">Data rows with hover and selection states</p>
          <div className="component-demo">
            <div className="demo-table-row">
              <div className="demo-td">SKU-001</div>
              <div className="demo-td">Wireless Mouse</div>
              <div className="demo-td">150</div>
              <div className="demo-td"><span className="status-badge in-stock">In Stock</span></div>
            </div>
            <div className="demo-table-row selected">
              <div className="demo-td">SKU-002</div>
              <div className="demo-td">Keyboard</div>
              <div className="demo-td">30</div>
              <div className="demo-td"><span className="status-badge low-stock">Low Stock</span></div>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="component-section full-width">
          <h2>Color Palette</h2>
          <p className="section-desc">Theme colors used throughout the table</p>
          <div className="color-palette">
            <div className="color-swatch">
              <div className="swatch" style={{ backgroundColor: '#646cff' }}></div>
              <span>Primary<br/>#646cff</span>
            </div>
            <div className="color-swatch">
              <div className="swatch" style={{ backgroundColor: '#22c55e' }}></div>
              <span>Success<br/>#22c55e</span>
            </div>
            <div className="color-swatch">
              <div className="swatch" style={{ backgroundColor: '#eab308' }}></div>
              <span>Warning<br/>#eab308</span>
            </div>
            <div className="color-swatch">
              <div className="swatch" style={{ backgroundColor: '#ef4444' }}></div>
              <span>Danger<br/>#ef4444</span>
            </div>
            <div className="color-swatch">
              <div className="swatch" style={{ backgroundColor: '#1e1e3f' }}></div>
              <span>Header BG<br/>#1e1e3f</span>
            </div>
            <div className="color-swatch">
              <div className="swatch" style={{ backgroundColor: '#3a3a5a' }}></div>
              <span>Border<br/>#3a3a5a</span>
            </div>
          </div>
        </section>
      </div>

      <style>{`
        .page {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-block;
          margin-bottom: 1rem;
          font-size: 0.9em;
        }

        .page-header p {
          color: #888;
          margin: 0;
        }

        .components-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }

        .component-section {
          background: rgba(30, 30, 63, 0.5);
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #3a3a5a;
        }

        .component-section.full-width {
          grid-column: 1 / -1;
        }

        .component-section h2 {
          font-size: 1.1em;
          margin: 0 0 0.25rem;
        }

        .section-desc {
          color: #888;
          font-size: 0.85em;
          margin: 0 0 1rem;
        }

        .component-demo {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
        }

        .code-block {
          margin-top: 1rem;
          padding: 1rem;
          background: #0d0d1a;
          border-radius: 6px;
          overflow-x: auto;
        }

        .code-block code {
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.8em;
          color: #a0a0ff;
          white-space: pre;
        }

        /* Demo table elements */
        .demo-table-header {
          display: flex;
          background: #1e1e3f;
          border-radius: 6px;
          overflow: hidden;
        }

        .demo-th {
          padding: 0.75rem 1rem;
          font-weight: 600;
          font-size: 0.9em;
        }

        .demo-th.sortable {
          cursor: pointer;
        }

        .demo-table-row {
          display: flex;
          border-bottom: 1px solid #3a3a5a;
          transition: background-color 0.15s;
        }

        .demo-table-row:last-child {
          border-bottom: none;
        }

        .demo-table-row:hover {
          background: rgba(100, 108, 255, 0.1);
        }

        .demo-table-row.selected {
          background: rgba(100, 108, 255, 0.2);
        }

        .demo-td {
          padding: 0.75rem 1rem;
          font-size: 0.9em;
        }

        /* Color palette */
        .color-palette {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .color-swatch {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .swatch {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.1);
        }

        .color-swatch span {
          font-size: 0.75em;
          text-align: center;
          color: #888;
        }

        /* Status badge styles (imported from table.css context) */
        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.6rem;
          border-radius: 12px;
          font-size: 0.8em;
          font-weight: 500;
        }

        .status-badge.in-stock {
          background-color: rgba(34, 197, 94, 0.2);
          color: #22c55e;
        }

        .status-badge.low-stock {
          background-color: rgba(234, 179, 8, 0.2);
          color: #eab308;
        }

        .status-badge.out-of-stock {
          background-color: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .sort-indicator {
          color: #646cff;
        }

        .row-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #646cff;
        }

        @media (prefers-color-scheme: light) {
          .component-section {
            background: rgba(248, 248, 255, 0.8);
            border-color: #ddd;
          }

          .component-demo {
            background: rgba(0, 0, 0, 0.03);
          }

          .code-block {
            background: #f5f5ff;
          }

          .code-block code {
            color: #5050aa;
          }

          .demo-table-header {
            background: #f8f8ff;
          }

          .swatch {
            border-color: rgba(0, 0, 0, 0.1);
          }
        }
      `}</style>
    </div>
  )
}

export default TableComponents
