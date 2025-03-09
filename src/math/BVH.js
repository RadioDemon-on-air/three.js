import { BVHNode } from './BVHNode.js';
import {Vector3} from "./Vector3.js";

class BVH {
	constructor(positions, indexes) {

		const triangles = [];

		for (let i = 0; i < indexes.count; i += 3) {

			let v0 = new Vector3(), v1 = new Vector3(), v2 = new Vector3();

			v0.fromBufferAttribute(positions, indexes.getX( i ));
			v1.fromBufferAttribute(positions, indexes.getX( i + 1 ));
			v2.fromBufferAttribute(positions, indexes.getX( i + 2 ));

			triangles.push({
				vertices: [v0, v1, v2],
				indices: [indexes.getX( i ), indexes.getX( i + 1 ), indexes.getX( i + 2 )],
				faceIndex: i,
				center: [
					(v0.x + v1.x + v2.x) / 3,
					(v0.y + v1.y + v2.y) / 3,
					(v0.y + v1.y + v2.y) / 3
				]
			});
		}

		this.root = this.build(triangles, 0);
	}

	build(triangles, depth) {
		if (triangles.length <= 4) return new BVHNode(this.computeBounds(triangles), triangles); // Leaf node

		const axis = depth % 3; // Cycle between X, Y, Z
		triangles.sort((a, b) => a.center[axis] - b.center[axis]);
		const mid = Math.floor(triangles.length / 2);

		const node = new BVHNode(this.computeBounds(triangles));
		node.left = this.build(triangles.slice(0, mid), depth + 1);
		node.right = this.build(triangles.slice(mid), depth + 1);
		return node;
	}

	computeBounds(triangles) {
		let min = new Vector3(Infinity, Infinity, Infinity);
		let max = new Vector3(-Infinity, -Infinity, -Infinity);

		for (const tri of triangles) {
			for (const v of tri.vertices) {
				min.x = Math.min(min.x, v.x);
				min.y = Math.min(min.y, v.y);
				min.z = Math.min(min.z, v.z);

				max.x = Math.max(max.x, v.x);
				max.y = Math.max(max.y, v.y);
				max.z = Math.max(max.z, v.z);
			}
		}

		return { min, max };
	}

	rayIntersect(ray, intersections = [], node = this.root) {
		if (!node.bounds) {
			console.log("wait what");
		}
		if (!this.intersectAABB(ray, node.bounds)) return intersections;

		if (node.isLeaf()) {
			node.triangles.forEach(tri => {
				if (this.intersectTriangle(ray, tri)) intersections.push(tri);
			});
		}
		else {
			this.rayIntersect(ray, intersections, node.left);
			this.rayIntersect(ray, intersections, node.right);
		}
	}


	intersectAABB(ray, bounds) {
		const invD = new Vector3(1, 1, 1).divide(ray.direction);

		const t1 = bounds.min.clone().sub(ray.origin).multiply(invD);
		const t2 = bounds.max.clone().sub(ray.origin).multiply(invD);

		const tMin = Math.max(Math.min(t1.x, t2.x), Math.min(t1.y, t2.y), Math.min(t1.z, t2.z), 0);
		const tMax = Math.min(Math.max(t1.x, t2.x), Math.max(t1.y, t2.y), Math.max(t1.z, t2.z), Infinity);

		return tMax >= tMin;
	}

	intersectTriangle(ray, triangle) {

		const v0 = triangle.vertices[0];
		const v1 = triangle.vertices[1];
		const v2 = triangle.vertices[2];

		const edge1 = v1.clone().sub(v0);
		const edge2 = v2.clone().sub(v0);

		const h = ray.direction.clone().cross(edge2);
		const a = edge1.dot(h);

		if (Math.abs(a) < 1e-6) return false;

		const f = 1 / a;
		const s = ray.origin.clone().sub(v0);
		const u = f * s.dot(h);

		if (u < 0 || u > 1) return false;

		const q = s.clone().cross(edge1);
		const v = f * ray.direction.dot(q);

		if (v < 0 || u + v > 1) return false;

		return f * edge2.dot(q) > 1e-6;
	}
}

export { BVH }
