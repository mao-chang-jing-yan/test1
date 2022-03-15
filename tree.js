class Node {
    constructor(parent, name, children = []) {
        this.name = name
        this.children = children
        this.parent = parent
        this.isRepeat = false
        this.repeatPaths = []
    }

    addChildrenByName(name) {
        const this_ = this
        let cN = new Node(this_, name, [])
        if (!this_.children.includes(cN)) {
            this_.children.push(cN)
        }
    }

    addChildren(node) {
        const this_ = this
        if (!this_.children.includes(node)) {
            this_.children.push(node)
        }
    }
}


class Tree {
    constructor(name) {
        this.nodeMap = {}
        this.names = []
        this.names.push(name)
        this.root = new Node(null, name, [])
        this.nodeMap[name] = this.root;
    }

    addList(names = []) {
        if (names.length <= 1 || names[0] !== this.root.name) {
            return
        }
        let root = this.root;

        // let path = [];
        // let repeatPaths = [];


        for (let i = 1; i < names.length; i++) {
            let name = names[i];
            if (this.names.includes(name)){
                root = this.nodeMap[name];
                continue;
            }

            let n = new Node(root, name, []);
            root.addChildren(n);
        }
    }

    _print(root){
        if (!root){
            return
        }
        console.log(root.name)
        for (let i = 0; i < root.children.length; i++) {
            this._print(root.children[i])
        }
    }

    print(){
        console.log(this._print(this.root))
    }

}

let tree = new Tree(0)

tree.addList([0,1,2,3,5])
tree.addList([0,2,2,3,5])

tree.print()

// console.log(a.includes(1))