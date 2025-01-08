// src/types/canvasjs.d.ts

declare module '@canvasjs/react-stockcharts' {
  interface DataPoint {
    x: number | Date;
    y: number;
    label?: string;
  }

  interface SeriesData {
    type: 'line' | 'column' | 'bar' | 'area' | 'scatter' | 'bubble' | 'candlestick';
    dataPoints: DataPoint[];
    name?: string;
    showInLegend?: boolean;
    legendText?: string;
  }

  interface ChartOptions {
    theme?: 'light1' | 'light2' | 'dark1' | 'dark2' | string;
    title?: {
      text: string;
      fontSize?: number;
      fontFamily?: string;
    };
    data?: SeriesData[];
    charts?: any[]
    axisX?: {
      title?: string;
      labelFormatter?: (e: { value: any }) => string;
    };
    axisY?: {
      title?: string;
      includeZero?: boolean;
    };
    zoomEnabled?: boolean;
    animationEnabled?: boolean;
    exportEnabled?: boolean;
  }

  interface CanvasJSStockChartProps {
    options: ChartOptions;
    containerProps?: React.HTMLAttributes<HTMLDivElement>;
    onRef?: (ref: any) => void;
  }

  class CanvasJSStockChart extends React.Component<CanvasJSStockChartProps, any> {}
  export default {CanvasJSStockChart}
}
