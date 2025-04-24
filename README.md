# BMRCL Station App

An interactive metro map and journey planner that helps you explore the Namma Metro network and plan your journey with ease: https://metro.bengawalk.com

Built with SvelteKit, MapLibre and Valhalla. Deployed on Cloudflare Pages.

## Development

- Install dependencies with `pnpm install` (or `npm install`)
- Start local dev server with `pnpm run dev` (or `npm run dev`)
- Build site deployment assets with `pnpm run build` (or `npm run build`)

### Code Structure

The codebase follows a SvelteKit project structure:

- `src/` - Main source code
  - `routes/` - SvelteKit route components and API endpoints
  - `lib/` - Shared libraries and components
    - `components/` - Reusable Svelte components
    - `utils/` - Utility functions including journey calculation logic
    - `config/` - Configuration files and constants
    - `stores/` - Svelte stores for state management
    - `types/` - TypeScript type definitions
  - `app.html` - Main HTML template
  - `app.css` - Global CSS styles
- `static/` - Static assets served as-is
  - `stations/` - Station floor plan SVGs and related assets
  - `icons/` - UI and station details icons
  - `*.geojson` - GeoJSON data files for the map and journey planning

### Data

The application uses several data sources:

- **Metro Network Data**
  - `bmrcl.geojson` - Contains the Namma Metro network lines and station locations
  - `points.geojson` - Exit gate points, platform points and other internal station points
  - `voronoi.geojson` - Voronoi polygons for spatial indexing and nearest-station lookup

- **Station Floor Plans**
  - SVG floor plans for each station stored in `static/stations/`
  - Each station has multiple floors (Concourse, Platform, etc.)

- **Journey Planning**
  - Uses Valhalla routing engine for walking directions
  - Custom algorithm for calculating metro journeys including transfers
  - Journey details include walking time, metro time, platform numbers, and exit information

## AI Declaration

Components of this repository, including code and documentation, were written with assistance from Claude AI.