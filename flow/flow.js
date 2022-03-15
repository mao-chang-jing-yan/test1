const preStr = "变体" // 变体前缀


class FlowVariant {
    constructor(flowCode, data) {
        this.beautifulRowDataAndSkip = this._defaultBeautifulRowDataAndSkip
        // 初始化数据
        this.flowCode = flowCode;
        this.caseMap = {};
        this.variantMap = {};
        this.data = data || [];
        this.activities = [];
        this._initTableList();
        this.skipRows = [];
        this.skipRowIds = [];

        // 处理数据
        this._caseMap();
        this._variantMap();
    }


    getTables() {
        // this.handleCaseMap();
        // 流程活动表
        for (let i = 0; i < this.activities.length; i++) {
            let item = {
                flowCode: this.flowCode,
                activity: this.activities[i],
            }
            this.flowActivityList.push(item)
        }

        this.handleVariantMap();
        return [
            // 变体活动表
            this.caseActivityList,
            // 变体案例表
            this.variantCaseList,
            // 流程变体表
            this.flowVariantList,
            // 流程活动表
            this.flowActivityList,
            // 活动详情表
            this.activityDetailList,
        ]
    }

    // 默认检查数据和判断是否跳过此条数据
    _defaultBeautifulRowDataAndSkip(index, item = {}) {
        try {
            let time1 = new Date(item.activityTime)
            if (isNaN(time1.valueOf()) || item.activityTime === undefined || item.activity === undefined || item.flowCase === undefined) {
                return true
            }
        } catch (e) {
            return true
        }
        return false
    }

    // 初始化数据表
    _initTableList() {
        // 变体活动表
        this.caseActivityList = [
            // {id: "", FlowCode: "", FlowVariant: "", activity: "", sequence: ""}
        ]
        // 变体案例表
        this.variantCaseList = [
            // {
            //     id: "",
            //     FlowCode: "",
            //     FlowVariant: "",
            //     FlowCase: "",
            //     startActivity: "",
            //     endActivity: "",
            //     startTime: "",
            //     endTime: "",
            //     caseTime: "",
            //     isReWork: ""
            // }
        ]
        // 流程变体表
        this.flowVariantList = [
            // {
            //     id: "",
            //     FlowCode: "",
            //     FlowVariant: "",
            //     FlowCaseCount: "",
            //     maxFlowCase: "",
            //     maxTime: "",
            //     minFlowCase: "",
            //     minTime: ""
            // }
        ]
        // 流程活动表
        this.flowActivityList = [
            // {id: "1", FlowCode: "", activity: ""},
        ]

        // 活动详情表
        this.activityDetailList = [
            // {flowCode: "", flowVariant: "", flowCase: "", activity: "", activityTime: "", endActivity: "", endTime: "",}
        ]
    }

    // 处理variantMap 生成变体活动表、变体案例表、流程变体表
    handleVariantMap() {
        for (const flowVariant in this.variantMap) {
            if (this.variantMap.hasOwnProperty(flowVariant)) {
                let variant = this.variantMap[flowVariant]

                // 变体活动表
                for (let i = 0; i < variant.path_names.length; i++) {
                    let caseActivityItem = {
                        flowCode: this.flowCode,
                        flowVariant: flowVariant,
                        activity: variant.path_names[i],
                        sequence: i,
                    }
                    this.caseActivityList.push(caseActivityItem)
                }

                // 变体案例表
                for (let i = 0; i < variant.flowCaseIdList.length; i++) {
                    let flowCaseId = variant.flowCaseIdList[i];
                    let flowCase = this.caseMap[flowCaseId];
                    let variantCaseItem = {
                        flowCode: this.flowCode,
                        flowVariant: flowVariant,
                        flowCase: flowCase.flowCase,
                        startActivity: flowCase.path[0].activity,
                        endActivity: flowCase.path[flowCase.path.length - 1].activity,
                        startTime: flowCase.path[0].activityTime,
                        endTime: flowCase.path[flowCase.path.length - 1].activityTime,
                        caseTime: flowCase.time,
                        isReWork: flowCase.isReWork
                    }
                    this.variantCaseList.push(variantCaseItem)

                    // 活动详情表
                    for (let j = 0; j < flowCase.path.length; j++) {
                        let nextIndex = j + 1;
                        let activityItem = flowCase.path[j];
                        activityItem.flowCode = this.flowCode;
                        activityItem.flowVariant = flowVariant;
                        if (nextIndex === flowCase.path.length) {
                            activityItem.endActivity = null;
                            activityItem.endTime = null;
                        } else {
                            activityItem.endActivity = flowCase.path[nextIndex].activity;
                            activityItem.endTime = flowCase.path[nextIndex].activityTime;
                        }
                        this.activityDetailList.push(activityItem);
                    }
                }

                // 流程变体表
                let item = {
                    flowCode: this.flowCode,
                    flowVariant: flowVariant,
                    flowCaseCount: variant.flowCaseCount,
                    maxFlowCase: variant.maxFlowCase,
                    maxTime: variant.maxTime,
                    minFlowCase: variant.minFlowCase,
                    minTime: variant.minTime,
                    avgTime: variant.avgTime,
                }
                this.flowVariantList.push(item)

            }
        }


    }


    // 重命名变体名称
    _reNameVariantName() {
        let m = {};
        let index = 0;
        for (const variantMapKey in this.variantMap) {
            if (this.variantMap.hasOwnProperty(variantMapKey)) {
                m[preStr + index] = this.variantMap[variantMapKey];
                delete this.variantMap[variantMapKey];
                index++;
            }
        }
        this.variantMap = m;
    }

    // 根据flowCase分组 获取每个case对应的变体信息
    _caseMap() {
        // 排序
        // this.data.sort(function (a, b) {
        //     let flag = 0;
        //     try {
        //         let time1 = new Date(a.activityTime);
        //         let time2 = new Date(b.activityTime);
        //         if (isNaN(time1.valueOf()) || isNaN(time2.valueOf())){
        //             return flag
        //         }
        //         flag = time1.valueOf() - time2.valueOf()
        //     } catch (e) {
        //         node.error(e)
        //     }
        //     return flag;
        // })
        for (let i = 0; i < this.data.length; i++) {
            let item = this.data[i];
            // 添加flowCode
            if (!item.flowCode) {
                item.flowCode = this.flowCode
            }
            // 是否跳过此条数据
            if (this.beautifulRowDataAndSkip(i, item)) {
                this.skipRows.push(item);
                this.skipRowIds.push(i);
                continue;
            }
            if (!this.activities.includes(item.activity)) {
                this.activities.push(item.activity);
            }

            let flowCase = item.flowCase
            if (!this.caseMap[flowCase]) {
                this.caseMap[flowCase] = {
                    path_ids: [item.id],
                    // 不变
                    flowCode: item.flowCode,
                    flowCase: flowCase,

                    // 变化
                    startActivity: item.activity,
                    startTime: item.activityTime,
                    path_names: [item.activity],
                    path: [item],
                    time: 0,
                    endActivity: null,
                    endTime: item.activityTime,
                    isReWork: false,
                }
                continue
            }

            if (this.caseMap[flowCase].path_names.includes(item.activity)) {
                item.isReWork = true;
            }

            if (this.caseMap[flowCase].path.length > 10) {
                this._insert2(item, this.caseMap[flowCase].path, this.caseMap[flowCase].path_names, this.caseMap[flowCase].path_ids);
            } else {
                this._insert(item, this.caseMap[flowCase].path, this.caseMap[flowCase].path_names, this.caseMap[flowCase].path_ids);
            }


            this.caseMap[flowCase].startTime = this.caseMap[flowCase].path[0].startTime;
            this.caseMap[flowCase].startActivity = this.caseMap[flowCase].path[0].startActivity;

            let startTime = this.caseMap[flowCase].path[0].activityTime
            let time = this.getTimeStamp(item.activityTime) - this.getTimeStamp(startTime);
            if (time < 0) {
                time = 0;
            }
            this.caseMap[flowCase].time = time;
            this.caseMap[flowCase].endTime = item.activityTime;
            this.caseMap[flowCase].endActivity = item.activity;
            this.caseMap[flowCase].isReWork = item.isReWork || this.caseMap[flowCase].isReWork;
        }
    }

    getTimeStamp(timeStr) {
        return new Date(timeStr).valueOf()
    }

    // 循环插入 如果时间相同 默认插入后面
    _insert(item, path, path_names, path_ids) {
        let path_length = path.length;
        for (let j = 0; j < path_length; j++) {
            if (this.getTimeStamp(item.activityTime) < this.getTimeStamp(path[j].activityTime)) {
                path.splice(j, 0, item);
                path_names.splice(j, 0, item.activity);
                path_ids.splice(j, 0, item.id);
                break
            }
            if (j + 1 === path_length &&
                this.getTimeStamp(item.activityTime) >= this.getTimeStamp(path[j].activityTime)
            ) {
                path.push(item);
                path_names.push(item.activity);
                path_ids.push(item.id);
                break
            }
        }
    }

    // 二分法插入 如果时间相同 默认插入后面
    _insert2(item, path, path_names, path_ids) {
        let length = path.length
        if (length === 0 ||
            length >= 1 && this.getTimeStamp(path[length - 1].activityTime) <= this.getTimeStamp(item.activityTime)
        ) {
            path.push(item);
            path_names.push(item.activity);
            path_ids.push(item.id);
            return;
        }
        if (length >= 1 && this.getTimeStamp(path[0].activityTime) >= this.getTimeStamp(item.activityTime)) {
            path.unshift(item);
            path_names.unshift(item.activity);
            path_ids.unshift(item.id);
            return;
        }

        let left = 0, right = length - 1;
        while (left + 1 < right) {
            let middle = Math.floor((left + right) / 2)
            if (this.getTimeStamp(item.activityTime) >= this.getTimeStamp(path[middle].activityTime)) {
                left = middle;
            }
            if (this.getTimeStamp(item.activityTime) <= this.getTimeStamp(path[middle].activityTime)) {
                right = middle;
            }
        }
        // 如果时间相同插入后面
        while (this.getTimeStamp(path[right].activityTime) === this.getTimeStamp(item.activityTime) &&
        right + 1 < length) {
            if (this.getTimeStamp(path[right + 1].activityTime) === this.getTimeStamp(item.activityTime)) {
                right++;
            } else {
                right++;
                break
            }
        }
        path.splice(right, 0, item);
        path_names.splice(right, 0, item.activity);
        path_ids.splice(right, 0, item.id);
    }


    // 根据caseMap 按照变体路径 获取变体的信息
    _variantMap() {
        for (const flowCase in this.caseMap) {
            if (this.caseMap.hasOwnProperty(flowCase)) {
                let caseInfo = this.caseMap[flowCase];
                let pathStr = JSON.stringify(caseInfo.path_names);
                if (!this.variantMap[pathStr]) {
                    this.variantMap[pathStr] = {
                        flowCaseCount: 1,
                        maxFlowCase: flowCase,
                        minFlowCase: flowCase,
                        minTime: caseInfo.time,
                        maxTime: caseInfo.time,
                        avgTime: caseInfo.time,
                        // flowCaseList: [caseInfo],
                        flowCaseIdList: [flowCase],
                        // path_ids: caseInfo.path_ids,
                        path_names: caseInfo.path_names,
                        // path: value.path,
                    }
                    continue
                }
                this.variantMap[pathStr].flowCaseIdList.push(flowCase);
                let oldCount = this.variantMap[pathStr].flowCaseCount;
                this.variantMap[pathStr].flowCaseCount = oldCount + 1;
                this.variantMap[pathStr].avgTime = (this.variantMap[pathStr].avgTime * oldCount + caseInfo.time) / this.variantMap[pathStr].flowCaseCount;

                if (caseInfo.time > this.variantMap[pathStr].maxTime) {
                    this.variantMap[pathStr].maxFlowCase = flowCase;
                    this.variantMap[pathStr].maxTime = caseInfo.time;
                }

                if (caseInfo.time < this.variantMap[pathStr].minTime) {
                    this.variantMap[pathStr].minFlowCase = flowCase;
                    this.variantMap[pathStr].minTime = caseInfo.time;
                }
            }
        }
        // 重命名变体名称
        this._reNameVariantName();
    }

}

module.exports = FlowVariant