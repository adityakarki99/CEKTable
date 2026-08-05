import { Link } from 'react-router-dom'
import { Checkbox } from '../components/Checkbox'
import '../components/table.css'

function TableComponents() {
  return (
    <div className="page">
      <div className="page-header">
        <Link to="/" className="back-link">&larr; Back to Home</Link>
        <h1>Table Components</h1>
        <p>Clay-inspired UI components for building modern data tables.</p>
      </div>

      <div className="components-grid">
        {/* Status Badges */}
        <section className="component-section">
          <h2>Status Badges</h2>
          <p className="section-desc">Visual indicators with dot prefix for inventory status</p>
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
          <h2>Buttons</h2>
          <p className="section-desc">Primary and secondary button variants</p>
          <div className="component-demo">
            <button>Primary Action</button>
            <button className="secondary">Secondary</button>
          </div>
          <div className="component-demo" style={{ marginTop: '0.75rem' }}>
            <button disabled>Disabled</button>
          </div>
        </section>

        {/* Pagination Controls */}
        <section className="component-section">
          <h2>Pagination</h2>
          <p className="section-desc">Navigation controls for paged data</p>
          <div className="component-demo pagination-demo">
            <div className="pagination-controls">
              <button className="secondary">{'<<'}</button>
              <button className="secondary">{'<'}</button>
              <span className="page-info">Page 1 of 5</span>
              <button className="secondary">{'>'}</button>
              <button className="secondary">{'>>'}</button>
            </div>
          </div>
        </section>

        {/* Input Fields */}
        <section className="component-section">
          <h2>Search Input</h2>
          <p className="section-desc">Global search with focus ring</p>
          <div className="component-demo">
            <input
              type="text"
              placeholder="Search all columns..."
              className="global-filter"
            />
          </div>
        </section>

        {/* Checkboxes */}
        <section className="component-section">
          <h2>Row Selection</h2>
          <p className="section-desc">Custom checkboxes with purple accent</p>
          <div className="component-demo">
            <label className="checkbox-label">
              <Checkbox aria-label="Unselected row" />
              <span>Unselected row</span>
            </label>
            <label className="checkbox-label">
              <Checkbox aria-label="Selected row" defaultChecked />
              <span>Selected row</span>
            </label>
          </div>
        </section>

        {/* Selection Info Badge */}
        <section className="component-section">
          <h2>Selection Info</h2>
          <p className="section-desc">Shows count of selected rows</p>
          <div className="component-demo">
            <span className="selection-info">3 rows selected</span>
          </div>
        </section>

        {/* Table Header */}
        <section className="component-section full-width">
          <h2>Table Header</h2>
          <p className="section-desc">Sortable column headers with uppercase labels and sort indicators</p>
          <div className="component-demo">
            <div className="table-wrapper" style={{ maxWidth: '600px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <Checkbox aria-label="Select all rows" />
                    </th>
                    <th className="sortable">
                      <div className="th-content">SKU</div>
                    </th>
                    <th className="sortable">
                      <div className="th-content">
                        Product Name
                        <span className="sort-indicator">↑</span>
                      </div>
                    </th>
                    <th className="sortable">
                      <div className="th-content">
                        Qty
                        <span className="sort-indicator">↓</span>
                      </div>
                    </th>
                    <th>
                      <div className="th-content">Status</div>
                    </th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </section>

        {/* Table Rows */}
        <section className="component-section full-width">
          <h2>Table Rows</h2>
          <p className="section-desc">Data rows with hover and selection states</p>
          <div className="component-demo">
            <div className="table-wrapper" style={{ maxWidth: '700px' }}>
              <table className="data-table">
                <tbody>
                  <tr>
                    <td style={{ width: '40px' }}>
                      <Checkbox aria-label="Select row" />
                    </td>
                    <td>SKU-001</td>
                    <td>Wireless Mouse Pro</td>
                    <td>150</td>
                    <td><span className="status-badge in-stock">In Stock</span></td>
                  </tr>
                  <tr className="selected">
                    <td style={{ width: '40px' }}>
                      <Checkbox aria-label="Select row" defaultChecked />
                    </td>
                    <td>SKU-002</td>
                    <td>Mechanical Keyboard</td>
                    <td>30</td>
                    <td><span className="status-badge low-stock">Low Stock</span></td>
                  </tr>
                  <tr>
                    <td style={{ width: '40px' }}>
                      <Checkbox aria-label="Select row" />
                    </td>
                    <td>SKU-003</td>
                    <td>USB-C Hub</td>
                    <td>0</td>
                    <td><span className="status-badge out-of-stock">Out of Stock</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Color Palette */}
        <section className="component-section full-width">
          <h2>Color Palette</h2>
          <p className="section-desc">Clay-inspired purple theme colors</p>
          <div className="color-palette">
            <div className="color-group">
              <h3>Primary</h3>
              <div className="color-row">
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#8b5cf6' }}></div>
                  <span>Violet<br/>#8b5cf6</span>
                </div>
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#a78bfa' }}></div>
                  <span>Violet Light<br/>#a78bfa</span>
                </div>
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#7c3aed' }}></div>
                  <span>Violet Dark<br/>#7c3aed</span>
                </div>
              </div>
            </div>
            <div className="color-group">
              <h3>Status</h3>
              <div className="color-row">
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#10b981' }}></div>
                  <span>Success<br/>#10b981</span>
                </div>
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#f59e0b' }}></div>
                  <span>Warning<br/>#f59e0b</span>
                </div>
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#ef4444' }}></div>
                  <span>Danger<br/>#ef4444</span>
                </div>
              </div>
            </div>
            <div className="color-group">
              <h3>Neutrals (Slate)</h3>
              <div className="color-row">
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#f8fafc' }}></div>
                  <span>50<br/>#f8fafc</span>
                </div>
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#e2e8f0' }}></div>
                  <span>200<br/>#e2e8f0</span>
                </div>
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#64748b' }}></div>
                  <span>500<br/>#64748b</span>
                </div>
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#1e293b' }}></div>
                  <span>800<br/>#1e293b</span>
                </div>
                <div className="color-swatch">
                  <div className="swatch" style={{ backgroundColor: '#0f172a' }}></div>
                  <span>900<br/>#0f172a</span>
                </div>
              </div>
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
          font-size: 0.875rem;
        }

        .page-header p {
          margin: 0;
        }

        .components-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .component-section {
          background: white;
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
          box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.04),
            0 4px 12px rgba(0, 0, 0, 0.03);
        }

        .component-section.full-width {
          grid-column: 1 / -1;
        }

        .component-section h2 {
          font-size: 1rem;
          margin: 0 0 0.25rem;
        }

        .section-desc {
          font-size: 0.8rem;
          margin: 0 0 1rem;
        }

        .component-demo {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem;
          align-items: center;
          padding: 1.25rem;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #f1f5f9;
        }

        .pagination-demo {
          justify-content: center;
        }

        .pagination-demo .pagination-controls {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .pagination-demo button {
          padding: 0.5rem 0.75rem;
          min-width: 36px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: #334155;
        }

        .code-block {
          margin-top: 1rem;
          padding: 1rem;
          background: #0f172a;
          border-radius: 8px;
          overflow-x: auto;
        }

        .code-block code {
          font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
          font-size: 0.75rem;
          color: #a78bfa;
          white-space: pre;
          line-height: 1.6;
        }

        /* Color palette */
        .color-palette {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .color-group h3 {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748b;
          margin-bottom: 0.75rem;
        }

        .color-row {
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
          width: 56px;
          height: 56px;
          border-radius: 10px;
          box-shadow:
            0 1px 3px rgba(0, 0, 0, 0.1),
            inset 0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        .color-swatch span {
          font-size: 0.7rem;
          text-align: center;
          color: #64748b;
          line-height: 1.4;
        }

        /* Dark mode overrides */
        @media (prefers-color-scheme: dark) {
          .component-section {
            background: #1e293b;
            border-color: #334155;
          }

          .component-demo {
            background: #0f172a;
            border-color: #1e293b;
          }

          .checkbox-label {
            color: #e2e8f0;
          }

          .code-block {
            background: #020617;
          }

          .swatch {
            box-shadow:
              0 1px 3px rgba(0, 0, 0, 0.3),
              inset 0 0 0 1px rgba(255, 255, 255, 0.05);
          }
        }
      `}</style>
    </div>
  )
}

export default TableComponents
