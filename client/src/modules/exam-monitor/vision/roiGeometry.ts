import { NormalizedRoi } from '../types/observations';
import { PersonDetectionBox } from '../types/vision';

export interface RoiIntersectionResult {
  hasIntersection: boolean;
  intersectionRatio: number; // Ratio of bounding box area inside ROI
  roiId: string;
  category: string;
  score: number;
  boundingBox: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
}

/**
 * Geometric utility for calculating intersections between detected person bounding boxes
 * and configured camera preview Regions of Interest (ROI).
 */
export class RoiGeometryEngine {
  /**
   * Default configured restricted zone: Top-left perimeter (e.g. door/hallway line of sight)
   */
  public static readonly DEFAULT_RESTRICTED_ROI: NormalizedRoi = {
    id: 'roi_top_left_perimeter',
    name: 'Restricted Entry Frustum',
    x: 0.05,
    y: 0.05,
    width: 0.35,
    height: 0.35
  };

  /**
   * Evaluate intersection between a single detection bounding box and a normalized ROI.
   */
  public static evaluateIntersection(
    detection: PersonDetectionBox,
    roi: NormalizedRoi = this.DEFAULT_RESTRICTED_ROI
  ): RoiIntersectionResult {
    const box = detection.box;

    // Filter to person category only
    if (detection.category.toLowerCase() !== 'person') {
      return {
        hasIntersection: false,
        intersectionRatio: 0,
        roiId: roi.id,
        category: detection.category,
        score: detection.score,
        boundingBox: { ...box }
      };
    }

    const boxLeft = Math.max(0, Math.min(1, box.originX));
    const boxTop = Math.max(0, Math.min(1, box.originY));
    const boxRight = Math.max(0, Math.min(1, box.originX + box.width));
    const boxBottom = Math.max(0, Math.min(1, box.originY + box.height));

    const roiLeft = roi.x;
    const roiTop = roi.y;
    const roiRight = roi.x + roi.width;
    const roiBottom = roi.y + roi.height;

    // Calculate overlap rectangle
    const xOverlap = Math.max(0, Math.min(boxRight, roiRight) - Math.max(boxLeft, roiLeft));
    const yOverlap = Math.max(0, Math.min(boxBottom, roiBottom) - Math.max(boxTop, roiTop));
    const intersectionArea = xOverlap * yOverlap;

    const boxArea = Math.max(1e-5, (boxRight - boxLeft) * (boxBottom - boxTop));
    const intersectionRatio = Math.round((intersectionArea / boxArea) * 1000) / 1000;

    // Center point of detection
    const centerX = boxLeft + (boxRight - boxLeft) / 2;
    const centerY = boxTop + (boxBottom - boxTop) / 2;
    const centerInside = centerX >= roiLeft && centerX <= roiRight && centerY >= roiTop && centerY <= roiBottom;

    // Has intersection if > 15% of person area is in ROI or center point is inside ROI
    const hasIntersection = intersectionRatio >= 0.15 || (centerInside && intersectionRatio >= 0.05);

    return {
      hasIntersection,
      intersectionRatio,
      roiId: roi.id,
      category: detection.category,
      score: detection.score,
      boundingBox: {
        originX: Math.round(boxLeft * 1000) / 1000,
        originY: Math.round(boxTop * 1000) / 1000,
        width: Math.round((boxRight - boxLeft) * 1000) / 1000,
        height: Math.round((boxBottom - boxTop) * 1000) / 1000
      }
    };
  }

  /**
   * Filter and evaluate all detections against an ROI.
   */
  public static evaluateAll(
    detections: PersonDetectionBox[],
    roi: NormalizedRoi = this.DEFAULT_RESTRICTED_ROI
  ): {
    personCount: number;
    incursions: RoiIntersectionResult[];
  } {
    const persons = detections.filter(d => d.category.toLowerCase() === 'person');
    const incursions = persons
      .map(d => this.evaluateIntersection(d, roi))
      .filter(res => res.hasIntersection);

    return {
      personCount: persons.length,
      incursions
    };
  }
}
