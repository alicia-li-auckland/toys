# Progress AI Tracker

A modern, interactive project management timeline visualization tool built with HTML5, CSS3, and JavaScript.

## Features

- **Interactive Timeline**: Gantt chart-style visualization with planned vs actual progress
- **Real-time Search**: Filter tasks by name across the entire project hierarchy
- **Zone Filtering**: Filter tasks by project zones (EYD 1, EYD 2, DCH 1, DCH 2)
- **Status Indicators**: Visual indicators for behind-schedule tasks
- **Hover Details**: Detailed task information on hover
- **Expandable Hierarchy**: Collapsible project structure
- **Responsive Design**: Mobile-friendly interface
- **Today Line**: Current date indicator on the timeline

## Technology Stack

- **HTML5**: Semantic markup and modern structure
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide Icons**: Beautiful, customizable icons
- **Vanilla JavaScript**: No framework dependencies
- **Inter Font**: Modern, readable typography

## Getting Started

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd progress-ai-tracker
   ```

2. Open `index.html` in your web browser

3. No build process required - it's ready to use!

## Usage

### Navigation
- **Sidebar**: Quick access to different project views
- **Search Bar**: Type to filter tasks by name
- **Filter Button**: Click to filter by project zones
- **Timeline**: Scroll horizontally to view different time periods

### Timeline Features
- **Blue Outlines**: Planned schedule for each task
- **Filled Bars**: Actual progress (blue for on-schedule, red for behind)
- **Today Line**: Blue vertical line showing current date
- **Hover Cards**: Detailed task information appears on hover

### Task Status
- **Complete**: Tasks with actual end dates
- **In Progress**: Tasks with actual start dates but no end date
- **Behind Schedule**: Tasks that should have started but haven't
- **Not Started**: Future tasks

## Project Structure

```
progress-ai-tracker/
├── index.html          # Main application file
├── README.md           # Project documentation
└── .gitignore          # Git ignore file
```

## Data Structure

The application uses a hierarchical data structure:

```javascript
{
  id: 'task-id',
  name: 'Task Name',
  level: 2, // 0=root, 1=group, 2=task
  groupName: 'Zone Name',
  startDate: '2025-01-06',
  endDate: '2025-01-17',
  actualStartDate: '2025-01-07',
  actualEndDate: '2025-01-17',
  status: 'Complete|In Progress|Behind Schedule|Not Started'
}
```

## Customization

### Adding New Tasks
Edit the `rawData` array in the JavaScript section of `index.html`:

```javascript
{
  Task_ID: 'NEW-001',
  Task_Name: 'Zone Name - Task Description',
  Planned_Start_Date: '2025-01-01',
  Planned_Finish_Date: '2025-01-31',
  Actual_Start_Date: '2025-01-02',
  Actual_Finish_Date: ''
}
```

### Styling
- Modify Tailwind classes in the HTML
- Custom CSS is in the `<style>` section
- Colors and spacing can be adjusted via Tailwind utilities

## Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## License

MIT License - feel free to use this project for any purpose.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Deployment

This is a static site that can be deployed to any web hosting service:

- **GitHub Pages**: Push to a GitHub repository and enable Pages
- **Netlify**: Drag and drop the folder or connect your git repository
- **Vercel**: Import your git repository
- **Any web server**: Upload the files to any web hosting service

## Support

For issues or questions, please open an issue in the repository. 