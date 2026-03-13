import { Line, Text } from '@react-three/drei';
import type { Annotation } from '../../schemas/bunkie.schema';
import { useBunkieStore } from '../../store/useBunkieStore';

interface AnnotationsProps {
  annotations: Annotation[];
}

export function Annotations({ annotations }: AnnotationsProps) {
  const { showAnnotations, showDimensions } = useBunkieStore();

  return (
    <group>
      {annotations.map((annotation) => {
        // Skip dimension annotations if disabled
        if (annotation.type === 'dimension' && !showDimensions) return null;
        // Skip other annotations if disabled
        if (annotation.type !== 'dimension' && !showAnnotations) return null;

        return <Annotation3D key={annotation.id} annotation={annotation} />;
      })}
    </group>
  );
}

interface Annotation3DProps {
  annotation: Annotation;
}

function Annotation3D({ annotation }: Annotation3DProps) {
  const color = annotation.color || '#ffffff';

  if (annotation.type === 'dimension' && annotation.endPosition) {
    return (
      <group>
        {/* Dimension line */}
        <Line
          points={[
            [annotation.position.x, annotation.position.y, annotation.position.z],
            [annotation.endPosition.x, annotation.endPosition.y, annotation.endPosition.z],
          ]}
          color="#ffffff"
          lineWidth={1}
        />
        {/* Dimension text */}
        <Text
          position={[
            (annotation.position.x + annotation.endPosition.x) / 2,
            annotation.position.y + 0.15,
            (annotation.position.z + annotation.endPosition.z) / 2,
          ]}
          fontSize={0.1}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {annotation.text}
        </Text>
        {/* End caps */}
        <Line
          points={[
            [annotation.position.x, annotation.position.y - 0.05, annotation.position.z],
            [annotation.position.x, annotation.position.y + 0.05, annotation.position.z],
          ]}
          color="#ffffff"
          lineWidth={1}
        />
        <Line
          points={[
            [annotation.endPosition.x, annotation.endPosition.y - 0.05, annotation.endPosition.z],
            [annotation.endPosition.x, annotation.endPosition.y + 0.05, annotation.endPosition.z],
          ]}
          color="#ffffff"
          lineWidth={1}
        />
      </group>
    );
  }

  if (annotation.type === 'label' || annotation.type === 'note') {
    return (
      <Text
        position={[annotation.position.x, annotation.position.y, annotation.position.z]}
        fontSize={annotation.fontSize || 0.08}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {annotation.text}
      </Text>
    );
  }

  return null;
}

interface DimensionLineProps {
  start: [number, number, number];
  end: [number, number, number];
  label: string;
  offset?: number;
}

export function DimensionLine({ start, end, label, offset = 0.2 }: DimensionLineProps) {
  const { showDimensions } = useBunkieStore();

  if (!showDimensions) return null;

  // Calculate midpoint for label
  const midX = (start[0] + end[0]) / 2;
  const midY = (start[1] + end[1]) / 2 + offset;
  const midZ = (start[2] + end[2]) / 2;

  return (
    <group>
      {/* Main line */}
      <Line
        points={[start, end]}
        color="#ffffff"
        lineWidth={1}
      />
      {/* Label */}
      <Text
        position={[midX, midY, midZ]}
        fontSize={0.08}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#000000"
      >
        {label}
      </Text>
    </group>
  );
}
