# CVM Analysis Dashboard

An interactive web application for visualizing CVM (Computer Vision Model) analysis data with multiple themes and visualization options.

## Features

- Upload and visualize CSV data with CVM analysis
- Interactive stacked bar chart showing reimbursement amounts by model and CVM analysis type
- Sunburst chart for hierarchical data visualization (when expense type data is available)
- Multiple theme options for different visual styles
- Download visualizations as PNG
- View and download filtered data
- Responsive design that works on different screen sizes

## Prerequisites

- Python 3.7+
- pip (Python package manager)

## Installation

1. Clone the repository or download the source code
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Run the application:
   ```
   streamlit run app.py
   ```
2. Open your web browser and navigate to the URL shown in the terminal (usually http://localhost:8501)
3. Upload a CSV file containing your CVM analysis data
4. Use the sidebar to select different visualization themes
5. Explore the different tabs for various visualizations
6. Download visualizations or filtered data as needed

## Expected CSV Format

Your CSV file should include these columns (case-sensitive):
- `Model name` - Name of the model
- `Reimbursement amount (USD)` - The amount to be reimbursed
- `CVM Analysis` - One of: TPOS, FPOS, FNEG, TNEG
- `Expense type` - (Optional) Used for the sunburst chart

## Themes

Choose from several built-in themes:
- plotly
- plotly_white
- plotly_dark
- ggplot2
- seaborn
- simple_white

## License

This project is open source and available under the MIT License.
