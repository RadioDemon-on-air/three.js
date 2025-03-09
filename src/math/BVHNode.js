class BVHNode {
	constructor(bounds, triangles = []) {
		this.bounds = bounds; // AABB (min, max)
		this.triangles = triangles; // Leaf node stores triangles
		this.left = null;
		this.right = null;
	}

	isLeaf() {
		return this.triangles.length > 0;
	}
}

export { BVHNode }
