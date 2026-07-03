# SPEC_V2 ADDENDUM — CATEGORY TAXONOMY (extends R5)
Save as `SPEC_V2_CATEGORIES.md` in repo root, commit it. This SUPERSEDES the "12 categories" in R5 with a full two-level taxonomy.

## Instructions for Claude Code
1. Parse the RAW TAXONOMY below into a seed file `lib/data/categories.ts`:
   - Lines that are single letters (A, B, C…) = index letters, skip.
   - A line followed by indented/subsequent lines until the next top-level entry = a TOP-LEVEL CATEGORY with its SUBCATEGORIES. In the raw text below, top-level categories are the lines I've marked with "## " and subcategories are the "- " lines beneath them.
   - Generate: slug (kebab-case), name, parent, synonyms field (empty array to start).
2. Schema: add `categories` + `company_categories` (many-to-many) + `category` on jobs. Migrate existing 12 categories into the new tree (they all exist in it).
3. UI:
   - **Popular Categories grid** (customer app home + public /find page): the ~26 most-demanded top-levels, each with a licensed photo tile (Unsplash/Pexels — NEVER images from HiPages or Google Images): Air Conditioning, Arborist, Bathroom, Builder, Carpenters, Cleaning, Concreting, Decking, Doors, Electricians, Fencing, Handyman, Kitchen, Landscaping & Gardening, Painters, Paving, Pest Control, Plastering & Gyprock, Plumbers, Rendering, Retaining Walls, Roofing, Security, Tilers, Waterproofing, Windows.
   - **More Categories A–Z** section below the grid: full text index, two-column mobile / four-column desktop, anchor letters.
   - Category page `/find/[category]`: hero w/ category photo, subcategory chip filters, pros in that category (4 R's ordering), related cost-guide slot, matching open jobs teaser (pro side).
   - Pro onboarding + profile editing: search-as-you-type category picker over the full tree (multi-select, primary + secondary).
   - Job posting: category picker (top-level required, subcategory optional); job cards show category thumbnail.
4. SEO: every top-level category = indexable page with meta + JSON-LD ItemList; sitemap. Suburb × category pages (/find/[category]/[suburb]) generated for launch suburbs only (Melbourne SE list in seed) to avoid thin-page spam.
5. Copy: write our OWN one-line description per top-level category (plain Aussie English). Do not reuse any competitor sentence.
6. Acceptance: taxonomy count parsed = count in raw list; category grid photos all licensed + local; e2e: customer picks Tilers → sees tilers; tradie picks Bricklaying → sees bricklaying jobs; pro selects 3 categories in onboarding and appears in all 3 directories.

## RAW TAXONOMY (source: standard AU trade-directory taxonomy)
## Air Conditioning
- Repairs & Maintenance
- Installation
- Suppliers
- Ducted
- Evaporative Cooling
- Split System
- Refrigeration
- Reverse Cycle
- Air Conditioners
- Air Conditioner Cleaning
## Antenna Services
- Suppliers & Installation
- Repairs & Troubleshooting
- Antenna Relocation
- Foxtel, TV & Satellite
- Digital TV Points
## Appliance Installation
- Oven Installation
- Dishwasher Installation
- Cooktop Installation
- Washing Machine Installation
- Rangehood Installation
## Appliance Repairs
- Air Conditioners
- Refrigerators
- Washing Machines
- Dishwashers
- Stoves & Cooktops
- Ovens & Range Hoods
- Clothes Dryers
- Hot Water Systems
- Heaters
- Television Repairs
- Microwaves
- Vacuum Cleaners
## Arborist
- Tree Consulting
- Tree Pruning
- Tree Surgery
- Tree Removal
- Stump Removal
## Architecture
- Commercial
- Residential
- Building Audits
- Extensions
- Project Management
- Tender
- Development Approvals
- Sustainable Design
- Heritage & Conservation
- New Homes
## Asbestos Removal
- Asbestos Demolition
- Inspections
- Monitoring
- Site Decontamination
- Small Clean-Ups
- Commercial
- Emergency Removal
## Asphalt
## Attic Access Ladders
## Awning Suppliers
- Automatic Awnings
- Drop Arm Awnings
- Fixed Awnings
- Folding Arm Awnings
- Pergola Awnings
- Roller Awnings
## Awnings
- Installation
- Custom Design
- Repairs
## Balustrading
- Fencing & Gates
- Stairs
- Balconies
## Bamboo Flooring
## Bath & Basin Resurfacing
- Bath
- Basin
- Tiles
- Shower
## Bathroom
- Bathroom Resurfacing
- Design
- Complete Bathroom Renovation
- Shower Installation
- Bath Installation
- Toilet Installation
- Basin Installation
- Repairs
- Builder
- Vanity Installation
- Waterproofers
- Cabinet Makers
- Tilers
## Bathroom Accessories
- Towel Rails & Rings
- Shelving & Cabinets
- Robe Hooks
- Tapware
- Toilet Seats
- Toilet Roll Holders
- Soap Dishes & Toothbrush Holders
- Shower Sets
- Mirrors
- Shampoo & Soap Dispensers
## Bathroom Fittings
- Bathroom Taps
- Heated Towel Rails
- Shower Heads
## Bathroom Sinks
- Stone Basins
- Wash Basins
## Bathroom Vanities
## Baths
## Beds
## Blinds
- Indoor
- Installers
- Full Service
- Blinds Suppliers
- Outdoor
- Holland Blinds
- Panel Glide Blinds
- Pleated Blinds
- PVC Cafe Blinds
- Roller Blinds
- Roman Blinds
- Timber Blinds
- Venetian Blinds
- Vertical Blinds
## Book Cases
## Brackets
## Bricklaying
- Brick Pointing
- Piering
- Fireplaces
- New Building
- Alterations & Additions
- Extensions
- Blockwork
- Brick Fences
## Building
- New Home
- Renovation
- Home Extensions
- General Building Work
- Project Management
- House & Land Packages
- Commercial
- Re Stumping
- Granny Flats
## Building Certifiers
## Building Consultants
- Development Applications
- Building Design
- Certification
- Inspections
- Dispute Resolutions
- Sustainable Building Advisor
## Building Designer
- Extensions & Additions
- New Homes
- Sustainable Design
- Commercial
- Industrial
- Unit Development
- Energy Rating Assessors
## Building Supplies
- Concrete
- Timber
- Steel
- Aluminium
- Sand
- Cement
- Plasterboard
- Adhesives
- DIY Building Material
## Building Surveyors
## Cabinet Doors
## Cabinet Hardware
## Cabinet Making
- Kitchen Renovations
- Bookcases
- Built-in Furniture
- Vanities
- Bathroom
- Home Office
- Benchtops
## Carpenters
- Doors
- Ramps
- House Frames
- Decking
- Windows
- Formwork
- Handrails
- Skirting
- Architraves
- Renovations
## Carpet & Upholstery Cleaning
- Carpet Dry Cleaning
- Carpet Steam Cleaning
- Sanitising & Deoderising
- Carpet & Fabric Protection
- Rug Cleaning
- Upholstery Cleaning
## Carpet Repair & Laying
- Repairs
- Laying
- Overlocking
- Restretch
- Stairs
## Carpet Suppliers
- Carpets
- Install
- Carpet Dyeing
## Carports
- Carpenter
- Builder
- Drafter
- Suppliers
## Ceilings
## Chairs
- Furniture - Chairs
## Chimney Sweepers
## Cladding
- Vinyl
- Brick
- Concrete
- Stone
- Timber
- Cement
- Material Suppliers
- External
- Internal
- Wall
## Cleaning
- Home Cleaners
- Rental Bond & Move Out Clean
- One Off Clean
- BBQ Cleaning
- Duct Cleaning
- Tile & Grout
- Washing & Ironing
- Oven Cleaning
- Deep Cleaning
- Mattress Cleaning
- Cleaning Products
## Cleaning Services - Commercial
- Office Cleaning
- Graffiti Removal
- Builder Clean Ups
- High Pressure Cleaning
- Exterior Cleaning
## Clothesline
## Coffee Tables
## Concrete Kerbs
- Install Driveway Edges
- Install Garden Edges
- Install Car Park Kerbs
- Suppliers
## Concrete Protection Materials
## Concrete Resurfacing
- Concrete Polishing
- Anti-Slip Concrete Resurfacing
- Concrete Repair & Reseal
- Decorative Concrete Coatings
## Concrete Waterproofing Materials
## Concreting
- Cleaning
- Coloured Concrete
- Concrete Pools
- Concrete Removal
- Concrete Retaining Walls
- Cutting
- Driveways
- Footpaths
- Formwork
- Foundations
- Grinding
- House Slabs
- Sealing
- Spray-On
- Reinforcement
- Exposed Aggregate Concrete
- Pumping
## Cubby Houses
## Curtains
- Custom Made
- Installers
- Suppliers
- Accessories
- Ready Made
- Fabrics
## Damp Proofing
## Decking
- Construction
- Sealing & Finishing
- Suppliers
- Decking Materials
- Timber Decking
- Composite Decking
- Decking Repairs
- Decking Oil
## Demolition
- Strip Outs
- Recycling Focused
- With Salvage Rights
- Without Salvage Rights
- Bathroom Stripout
## Dining Tables
## Door Handles
## Door Hardware
## Door Suppliers
- Automatic Doors
- Bi Fold Doors
- Entry Doors
- French Doors
- Internal Doors
- PVC Doors
- Security Doors
- Sliding Doors
- Aluminium Doors
## Doors
- Door Installation
- Door Repairs
- Door Replacement
- Fire Doors
- Frame Installation
- Restoration
## Drafting
- Extensions & Additions
- Carports
- Garages
- New Home
## Drains
## Ducted Vacuum Systems
## Electricians
- 24/7 Emergency Electricians
- Lighting
- Back Up Generators
- Data Cabling
- Fibre Optic Cables
- Home Automation
- Home Entertainment System
- New Homes
- New Installations
- Power Points
- Renovations
- Repairs
- Rewiring
- Safety Switches
- Security Lighting
- Switchboards
- Uninterruptible Power Supply (UPS)
- Solar Power
- Test & Tag
- EV Charger Installers
## Engineering - Structural
## Equipment Hire
- Bobcat
- Forklift
- Compacting Equipment
- Earth Moving Equipment
- Excavator
- Trenching Equipment
- Survey Equipment
- Power Tools
- Ladders
- Generators
- Access Equipment
- Crane
- Dingo Hire
## Excavation
- Boring
- Compacting
- Earth Moving
- Horizontal Directional Drilling
- Pit Installation
- Pool Excavations
- Post Hole Digging
- Service Location
- Site-Cuts
- Trenching
- Under Road Boring
- Confined Space (mini excavator)
## Extensions & Additions
- Design
- Building Permits
- Builders
- Ground Floor Extensions
- 2nd Storey Additions
- Garages
- Structural Engineers
- Project Management
## Fencing
- Timber
- Bamboo
- Brick
- Steel
- Vinyl
- Glass
- PVC
- Security
- Temporary
- General Contractor
- Aluminium
- Rural Fencing
- Colorbond Fencing
- Wire Fencing
- Fence Repairs
## Fencing Materials
- Fence Fittings
- Fence Panels
- Fence Posts
## Fencing Suppliers
- Pool Fencing Suppliers
- Garden Fencing Suppliers
- Glass Fencing Suppliers
- Security Fencing Suppliers
## Feng Shui
## Fire Protection Materials
## Fireplaces
- Fireplace Fascias
- Fireplace Inserts
- Fireplace Mantles
## Floor Coatings
- Timber Floor Coating
- Epoxy Floor Coating
- Antislip Surfacing
- Liming
- Wooden Staining
## Floor Sanding & Polishing
- Timber Floor Sanding
- Timber Floor Polishing
- Stone Polishing
- Concrete Polishing
## Flyscreens
- Repairs
- Install Flyscreen Doors
- Install Flyscreen Windows
- Install Retractable Screens
- Suppliers
## Frames & Trusses
- Roof Trusses
- Wall Frames
- Maintenance
## Furniture - Custom Design
- Consultation
- Custom Built Storage Solutions
- Custom Built Chairs
- Custom Built Tables
- Cabinets
- Upholstery
- Entertainment Units
## Furniture - Outdoor
## Furniture - Retailers
## Furniture - Second Hand
## Furniture Removal
- House Move
- Small Move
- Including Packing & Unpacking
- Interstate
- Overseas
- Corporate Move
## Garages
- Design
- Builders
- Steel Garages
- Garage Doors
- Garage Door Repairs
## Garden Designer
## Garden Features
## Garden Maintenance
- Pruning & Trimming
- Fertilising
- Weed Control
- Gardening
- Slashing
- Garden Rubbish Removal
- Garden Cleanup
## Garden Ornaments
- Suppliers
- Garden Sculpture
- Garden Statues
## Garden Supplies
- Suppliers
- Delivery Service
- Vertical Gardens
## Gas Fitters
- Gas Installation
- Gas Repairs
## Gates
- Automatic Gates
- Custom Gates
- Supply & Install
- Gate Suppliers
- Wrought Iron Gates
## Gazebo
- Design & Build
- Construction
- Gazebos Suppliers
## Glass & Glazing
- Splashbacks
- Glass Installations
- Glass Replacement
- Glazing
- Glass Cutting
- Glass Bricks
- Glass Balustrades
- Glass Suppliers
- Frameless Glass
- Leadlights
## Grates
## Gutter Cleaning
- Roof Gutters
- Stormwater Pits & Drains
- Commercial
## Gutter Suppliers
## Guttering
- Install Gutters
- Install Downpipes
- Install Steel Gutters
- Gutter Guards
- Repairs
- Rain Water Tank Set Up
- Stormwater Pits & Drains
- Gutter Replacement
## Handles
## Handrail Suppliers
## Handrails
- Stairs
- Balconies
## Handyman
- Basic Bricklaying
- Basic Carpentry
- Basic Concreting
- Window & Door Repairs
- Furniture Assembly
- Basic Garden Jobs
- Lock Repairs
- Odd Jobs
- Basic Painting
- Basic Plastering
- Shower Base Repair
- Basic Tiling
- Welding
- Picture & Mirror Hanging
- Basic Fencing
- Basic Paving
## Hardware
## Heaters
- Gas Heaters
## Heating Systems
- Supply & Install
- Maintenance
- Repairs
- Ducted Gas Heating
- Reverse Cycle
- Hydronic
## Home Automation
- Consultation & Installation
- Repairs
- Home Automation Systems
## Home Theatre
- Design & Install For Existing Premises
- Design & Install For New Premises
- Trouble Shooting Service
- Televisions
- Speakers
## Homewares
## Hot Water Systems
- Suppliers
- Installation
- Service & Repairs
- Solar Hot Water
- Gas
- Electric
- Heat Pumps
## IKEA Bathrooms
## IKEA Kitchen Installers
## IKEA Kitchen Planners
## IKEA Lighting Installation and Assembly
## Inspections - Building
- Pre-Purchase Property Inspections
- Commercial
- Fire Protection Inspections
- Completion / Defects Reports
- Expert Witness Reports
- Dilapidation Reports
- Home Owner Warranty Reports
- Pre-Purchase Building Reports
- Owner / Builder Reports
- Soil Testing
## Inspections - Pest
- Pre-Purchase Property Inspections
- Thermal Imaging
- Termites
- General Inspection Reports
## Insulation
- Supply
- Supply & Install Roof Insulation
- Supply & Install Wall Insulation
- Supply & Install Floor Insulation
- Supply & Install Ceiling Insulation
- Roof Insulation
## Interior Decorating
- Colour Consultancy
- Soft Furnishing Suppliers
- Wallpapering
- Fabric
## Interior Designer
- Complete Design Service
- Space Planning
- Interior Styling
- Bathroom Design
- Renovations
- Commercial
- Office
- Hospitality
- Materials & Finishes Selection
- Pre-Sale Styling
- Soft Furnishings Consultation
- Lighting Consultation
## Irrigation Systems
- Drip Irrigation Systems
- Irrigation Consultancy
- Irrigation Repairs
- Spray Systems
- Grey Water Systems
## Joinery
- Furniture
- Kitchens
- Windows & Doors
- Bathroom
- Shop & Office Fitouts
## Kit Homes
## Kitchen
- New Kitchen
- Kitchen Renovation
- Benchtops
- Resurfacing
- Cabinet Makers
- Tilers
- Flat Pack Kitchens
- Project Management
## Kitchen Appliances
- Ovens
- Rangehoods
## Kitchen Design
## Kitchen Fittings
- Kitchen Taps
- Kitchen Sinks
## Landscape Architecture
- Landscape Design
- Landscape Construction
- Project Management
## Landscaping & Gardening
- Landscape Design
- Landscape Construction
- Project Management
- Horticulture
## Lawn & Turf
- Supply
- Laying
- Synthetic Turf Supply & Install
- Disease And Pest Management
## Lawn Mowing
- Gardens
- Larger Fields
## Lifts
## Lighting
- Wiring
- Design Consultants
- Install
- Repairs
- Maintenance & Servicing
- Outdoor Lighting Design & Install
- Pool Lighting Design & Install
- Emergency Lighting Design & Install
## Lighting Suppliers
- Architectural Lighting
- Down Lights
- LED Lights
- Outdoor Lighting Suppliers
- Commercial Lighting
- Wall Lights
## Limestone
## Locks
## Locksmiths
- Supply & Install
- Key Cutting
- Safes
- Master Key Systems
- 24/7 Emergency
- Automotive
- Electronic & Biometric Locks
- Lockouts
## Louvre Roofs
## Mailboxes
## Marble Stone
## Mirrors
## Mouldings
## Natural Stone
## Nurseries
- Plants
- Water Features
## Paint Suppliers
- Outdoor
- Indoor
- Coatings
## Painters
- Interior
- Exterior
- Fence Painting
- Exterior Timber Maintenance
- Roof
- Colour Consulting
- Commercial
- Special Finishes
- Spray Painting
## Patios
- Builders
- Material Supplies
- Repairs
- Patio Cover Installations
- Patio Screens, Windows & Doors
- Patio Cover Suppliers
- Patio Suppliers
## Paving
- Driveways
- Patios
- Pool Areas
- Garden Edges
- Paths
- Paving Supply
- Stone Pavers
- Concrete Pavers
## Pergolas
- Timber Pergola Builders
- Metal Pergola Builders
- Pergola Covers
- Custom Design
- Construction
- Including Council Approval Service
- Pergola Screens, Windows & Doors
## Pest Control
- Ants
- Bee Removal
- Cockroaches
- Fleas
- Possums
- Rodent Control
- Rabbit Control
- Silverfish
- Snake Removal
- Spiders
- Termites
- Vermin
- Wasp Removal
- Bed Bugs
- Birds
- Preconstruction Treatments
- Pest Control Products
## Pipes
## Plastering & Gyprock
- Dry Wall
- Solid Wall
- Partitioning
- Ornamental
- Repairs
## Playground Equipment
## Plumbers
- Backflow Systems
- Blocked Drains
- New Drains
- Drain Repairs
- General Maintenance
- Grease Traps
- Grey Water Systems
- Home Renovations
- Hot Water Unit Repairs
- Hot Water Unit Installation
- New Homes
- Toilet Installation
- Toilet Repairs
- Rain Water Tank Installation
- Plumbing Installation
- 24/7 Emergency Plumbers
- Solar Hot Water
- Leak Detection
## Plunge Pools
## Polishes
## Pool Accessories
- Pool Filter
## Pool Builders
- New
- Renovation
- Resurfacing
- Repairs
- Permits
- Pool Inspections
## Pool Covers
## Pool Fencing
- Installation
- Glass Pool Fencing
## Pool Heating
- Solar Pool Heating
## Pool Maintenance
- Pool Cleaning Service
- Maintenance & Repairs
- Servicing
## Pool Suppliers
## Pots and Planters
## Pressure Cleaning
- Graffiti Removal
- Driveway Clean
- Brick Cleaning
- Pool Cleaning
- Paving Clean
## Privacy Screens
## Professional Organisers
## Project Management
## Rainwater Tanks
- Suppliers
- Repairs
- Installation
- Poly Water Tanks
## Render
## Rendering
- Bagging
- Cement Render
- Acrylic Render
## Reproduction Stone
## Retaining Wall Suppliers
## Retaining Walls
- Concrete Retaining Walls
- Stone Retaining Walls
- Timber Retaining Walls
- Material Suppliers
## Retractable Screen Suppliers
## Roller Doors
## Roller Shutters
## Roof Materials
- Roof Accessories
- Roof Tiles
## Roof Repairs
- Repointing
- Roof Tile Replacement
- Metal & Colorbond Roof Repairs
- Restoration
- General Maintenance
## Roofing
- Bedding & Pointing
- Roofing Material Suppliers
- Tiled Roofing
- Metal & Colorbond Roofing
- Roofing Contractors
## Rubbish Removal
- Rubbish Removal Service
- Skip & Bin Hire
## Rugs
## Saunas
## Scaffolding
- Hire Services
- Suppliers
- Erecting & Dismantling
## Screen Enclosures
## Security
- Alarm Systems
- CCTV
- Security Guards
- Security Card Access
- Security Lighting
- Intercom Systems
- 24 Hour Monitoring
- Access Control
## Security Screens & Doors
- Screen Install
- Door Install
- Repairs
## Shades & Sails
- Design & Install Sails
- Design & Install Umbrellas
- Other Shade Structures
- Giant Shade Umbrellas - Supply
- Sails - Supply
- Sunscreens
## Sheds
- Suppliers
- Shed Builders
## Shelves
## Shopfitters
- Custom Design
- Installation
- Office Fit Outs
- Project Management
- Raised Floor Installation
- Shop Doors
- Shop Fronts
- Shelving & Display Racks
## Shower Screens
- Custom Design
- Suppliers
- Repairs
- Replacement
- Frameless Shower Screens
## Skip & Truck Hire
- Skip Hire
- Mini Skip Bin Hire
- Truck & Ute Hire
## Skylights
- Install
- Supply
- Repairs
- Showrooms
## Solar Power
- Solar Panel Cleaners
- Solar Power Accessories
## Spas
- Spa Installation
- Spa Maintenance
- Spa Baths
- Showrooms
## Splashback Suppliers
## Splashbacks
- Supply & Install Glass Splashbacks
- Supply & Install Acrylic Splashbacks
- Showrooms
## Stained Glass
## Staircases
- Balustrading
- Staircase Design + Build
- Timber Staircase (Internal)
- Timber Staircase (External)
## Stone Veneer
## Stonemasonry
- Restoration & Repairs
- Stone Walls
- Stone Flagging
## Storage
- Self Storage
- Shelving & Storage Solutions
- Transport & Store
- Kitchen Storage
## Surveyors
- Land Surveyors
- Quantity Surveyors
## Tile Suppliers
- Outdoor Tiles
- Ceramic Tiles
- Stone Tiles
- Wall Tiles
- Floor Tiles
- Carpet Tiles
- Bathroom Tiles
- Granite Tiles
- Kitchen Tiles
- Marble Tiles
- Mosaic Tiles
- Pool Tiles
## Tilers
- Kitchen Tiling
- Bathroom Tiling
- Outdoor Paving
- Roof Tiling
- Tile Resurfacing
- Tile & Grout Cleaning
- Mosaic
- Tile Removal
- Floor Tiling
- Wall Tiling
- Grouting & Regrouting
## Timber Flooring
- Timber Floor Installation
- Floating Timber Floor Installation
- Solid Timber Floor Installation
- Timber Floor Coatings
- Timber Floor Repairs
- Timber Flooring Suppliers
## Toilet Suppliers
## Tools
- Garden Tools
- Hand Tools
- Power Tools
## Town Planning
## Tree Felling
- Land Clearing
- Stump Grinding
- 24/7 Emergency
- Felling
- Lopping
## TV Units
## Underfloor Heating
## Underpinning
## Upholstery Repair
- Repairs
- Restoration
- Re-upholstery
## Vacuum Cleaners
## Ventilation
- Condensation Removal
- Damp Removal
- Mould & Mildew Removal
- Musty Smell Removal
- Roof Ventilation
- Sub Floor Ventilation
- Trapped Heat Ventilation
- Mechanical Ventilation
## Verandahs
## Vinyl & Laminate
- Laminate Flooring Installation
- Vinyl Installation
- Vinyl Strip & Seal
- Benchtops
- Hybrid Flooring
## Wallpapering
- Supplies
- Installation
## Wardrobe Suppliers
## Wardrobes
- Shelving & Storage Solutions
- Built In Wardrobe Builders
- Standalone Wardrobe Builders
## Water Features
- Construction
- Custom Design
- Installation
- Suppliers
## Water Filtration Systems
## Water Pumps
## Waterproofing
- Caulking
- Chimney
- Balconies
- Bathroom
- Pools
- Ponds & Water Features
- Grout Seepage
- Seal Showers
- Rising Damp
- Tile Seepage
- Waterproofing Products
## Window Cleaning
- Standard
- Abseiling
## Window Repairs
- Glass Replacement
- Glass Repairs
- Window Frame Repairs
- 24/7 Emergency
## Window Shutters
- Venetian Shutters
- Timber Shutters
- Custom Design & Install
- External Shutters
- Installation Only
- Louvre Shutters
- Plantation Shutters
## Window Tinting
- Cars
- Home
- Office
- Security Film
## Windows
- Glass Supply & Replacement
- Whole Window Replacement
- Window Frames
- Window Installation
- Window Repairs
- Awning Windows
- Bi Fold Windows
- Casement Windows
- Double Glazed WIndows
- Double Hung Windows
- Louvre Windows
- PVC Windows
- Sliding Windows
- Aluminium Windows
- Timber Windows
## Wine Racks
## Wood Care Products
