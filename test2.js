// const crmodel = global.get("crmodel");
// const crUtils = global.get("crUtils");
// const crCache = crUtils.crCache;

const preStr = "变体" // 变体前缀

let flowCode = "p0p"
// 默认数据
let defaultData = [
    {id: "id1", flowCode: "1", flowVariant: "", flowCase: "1", activity: "1", activityTime: 0, isReWork: 0},
    {id: "id2", flowCode: "1", flowVariant: "", flowCase: "2", activity: "3", activityTime: 1, isReWork: 0},
    {id: "id3", flowCode: "1", flowVariant: "", flowCase: "1", activity: "2", activityTime: 2, isReWork: 0},
    {id: "id4", flowCode: "1", flowVariant: "", flowCase: "1", activity: "1", activityTime: 3, isReWork: 0},
]

// 读取csv
// function readCsvToList(){
//     let data = []
//     try {
//         let data_ = msg.req.files[0].buffer.toString().split("\n")
//
//         for (let i = 1; i < data_.length; i++) {
//             let item = data_[i].split(",")
//             data.push({
//                 // id: item[0],
//                 // flowCode: "1",
//                 flowVariant: "",
//                 flowCase: item[0],
//                 activity: item[1],
//                 activityTime: item[2],
//                 // isReWork: 0
//             })
//         }
//     } catch (e) {
//
//     }
//     return data
// }

function main() {

    let detailData = defaultData;
// let detailData = readCsvToList();
//     let detailData = data;
//     detailData = checkData(detailData)

    // node.error(["detailData", detailData]);

// data = [
//     {
//         case_id: "",
//         activity:"",
//         process_time:"",
//         handler:"",
//         origan:""
//     }
// ]

// 获取所有flowCase的id
// let flowCase_ids = []
// for (let i = 0; i < detailData.length; i++) {
//     flowCase_ids.push(detailData[i].flowCase)
// }

    // node.error(["checkData", detailData]);
    let flowMap = {
        flowCaseCount: 0,
        maxFlowCase: null,
        minFlowCase: null,
        minTime: null,
        maxTime: null,
        avgTime: null,
        // flowCaseList: [value],
        // path_ids: value.path_ids,
        // path_names: value.path_names,
        // path: value.path,
    } // || 查询flow map
    let flowCase_map = getCaseMap(detailData);
    console.log(flowCase_map)
    // let flowCodeVariant_map = getFlowCodeVariantMap(flowCase_map)
    // flowCodeVariant_map = reNameVariantName(flowCodeVariant_map)
    //
    // node.error(["flowCase_map", flowCase_map])
    // node.error(["flowCodeVariant_map", flowCodeVariant_map])
    //
    // node.error(["变体活动表", getCaseActivityList(flowCodeVariant_map)])
    // node.error(["变体案例表", getVariantCaseList(flowCodeVariant_map)])
    // node.error(["流程变体表", getFlowVariantList(flowCodeVariant_map)])
    // node.error(["流程活动表", getFlowActivityList(flowCase_map)])

}

// main()


// 校验参数
// function checkData(detailData = []) {
//     let data = []
//     for (let i = 0; i < detailData.length; i++) {
//         let item = detailData[i];
//         try {
//             item.activityTime =  new Date(item.activityTime).valueOf();
//             // console.log(item.activityTime, new Date(item.activityTime))
//             data.push(item)
//         } catch (e) {
//             node.error(e)
//         }
//     }
//     return data
// }


/*
* 根据flowCase得到case map
*
* */
function getCaseMap(data = []) {
    let case_map = {}
    data.sort(function (a, b) {
        let flag = 0;
        try {
            let time1 = new Date(a.activityTime);
            let time2 = new Date(b.activityTime);
            flag = time1.valueOf() - time2.valueOf()
        }catch (e) {}
        return flag;
    })
    console.log(data)
    for (let i = 0; i < data.length; i++) {
        let item = data[i];
        if (!item.flowCode) {
            item.flowCode = flowCode
        }

        let flowCase = item.flowCase
        if (!case_map[flowCase]) {
            case_map[flowCase] = {
                path_ids: [item.id],
                // 不变
                flowCode: item.flowCode,
                startActivity: item.activity,
                startTime: item.activityTime,
                flowCase: flowCase,

                // 变化
                path_names: [item.activity],
                path: [item],
                time: 0,
                endActivity: null,
                endTime: item.activityTime,
                isReWork: false,
            }
            continue
        }
        case_map[flowCase].path_ids.push(item.id)
        // case_map[flowCase].flowCase = flowCase
        if (case_map[flowCase].path_names.includes(item.activity)) {
            item.isReWork = true;
        }
        let startTime = case_map[flowCase].path[0].activityTime
        case_map[flowCase].path_names.push(item.activity)
        case_map[flowCase].path.push(item)
        case_map[flowCase].time = item.activityTime - startTime;
        case_map[flowCase].endTime = item.activityTime;
        case_map[flowCase].endActivity = item.activity;
        case_map[flowCase].isReWork = item.isReWork || case_map[flowCase].isReWork;
    }
    return case_map
}

function getVariantMap(caseMap) {
    let variantMap = {}
    for (const flowCase in caseMap) {
        if (caseMap.hasOwnProperty(flowCase)) {
            let caseInfo = caseMap[flowCase];
            let pathStr = JSON.stringify(caseInfo.path_names);
            if (!variantMap[pathStr]) {
                variantMap[pathStr] = {
                    flowCaseCount: 1,
                    maxFlowCase: flowCase,
                    minFlowCase: flowCase,
                    minTime: caseInfo.time,
                    maxTime: caseInfo.time,
                    avgTime: caseInfo.time,
                    flowCaseList: [caseInfo],
                    path_ids: caseInfo.path_ids,
                    path_names: caseInfo.path_names,
                    // path: value.path,
                }
                continue
            }
            variantMap[pathStr].flowCaseList.push(caseInfo);
            let oldCount = variantMap[pathStr].flowCaseCount;
            variantMap[pathStr].flowCaseCount = oldCount + 1;
            variantMap[pathStr].avgTime = (variantMap[pathStr].avgTime * oldCount + caseInfo.time) / variantMap[pathStr].flowCaseCount;

            if (caseInfo.time > variantMap[pathStr].maxTime) {
                variantMap[pathStr].maxFlowCase = flowCase;
                variantMap[pathStr].maxTime = caseInfo.time;
            }

            if (caseInfo.time < variantMap[pathStr].minTime) {
                variantMap[pathStr].minFlowCase = flowCase;
                variantMap[pathStr].minTime = caseInfo.time;
            }
        }
    }
    return reNameVariantName(variantMap)
}


function reNameVariantName(variantMap) {
    let m = {};
    let index = 0;
    for (const variantMapKey in variantMap) {
        if (variantMap.hasOwnProperty(variantMapKey)) {
            m[preStr + index] = variantMap[variantMapKey];
            delete variantMap[variantMapKey];
            index++;
        }
    }
    return m;
}


// 流程活动表
function getFlowActivityList(flowCode,caseMap) {
    let flowActivityList = [
        // {id: "1", FlowCode: "", activity: ""},
    ]
    for (const flowCase in caseMap) {
        if (caseMap.hasOwnProperty(flowCase)) {
            let value = caseMap[flowCase]
            for (let i = 0; i < value.path_names.length; i++) {
                let item = {
                    flowCode: value.flowCode || flowCode,
                    activity: value.path_names[i]
                }
                flowActivityList.push(item)
            }
        }
    }
    return flowActivityList
}

// 流程变体表
function getFlowVariantList(flowCode, variantMap) {
    let flowVariantList = [
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
    for (const flowVariant in variantMap) {
        if (variantMap.hasOwnProperty(flowVariant)) {
            let value2 = variantMap[flowVariant]
            let item = {
                flowCode: flowCode,
                flowVariant: flowVariant,
                flowCaseCount: value2.flowCaseCount,
                maxFlowCase: value2.maxFlowCase,
                maxTime: value2.maxTime,
                minFlowCase: value2.minFlowCase,
                minTime: value2.minTime
            }
            flowVariantList.push(item)
        }
    }
    return flowVariantList
}


// 变体案例表
function getVariantCaseList(flowCode, variantMap) {
    let variantCaseList = [
        // {
        //     id: "",
        //     FlowCode: "",
        //     FlowVariant: "",
        //     FlowCase: "",
        //     startActivity: "",
        //     endActivity: "",
        //     caseTime: "",
        //     isReWork: ""
        // }
    ]
    for (const flowVariant in variantMap) {
        if (variantMap.hasOwnProperty(flowVariant)) {
            let variant = variantMap[flowVariant]
            for (let i = 0; i < variant.flowCaseList.length; i++) {
                let flowCase = variant.flowCaseList[i]
                let item = {
                    flowCode: flowCode,
                    flowVariant: flowVariant,
                    flowCase: flowCase.flowCase,
                    startActivity: flowCase.path[0].flowCase,
                    endActivity: flowCase.path[flowCase.path.length - 1].flowCase,
                    caseTime: flowCase.time,
                    isReWork: flowCase.isReWork
                }
                variantCaseList.push(item)

            }
        }
    }

    return variantCaseList
}


// 变体活动表
function getCaseActivityList(flowCode, variantMap) {
    let caseActivityList = [
        // {id: "", FlowCode: "", FlowVariant: "", activity: "", sequence: ""}
    ]
    for (const flowVariant in variantMap) {
        if (variantMap.hasOwnProperty(flowVariant)) {
            let variant = variantMap[flowVariant]
            for (let i = 0; i < variant.path_names.length; i++) {
                let item = {
                    flowCode: flowCode,
                    flowVariant: flowVariant,
                    activity: variant.path_names[i],
                    sequence: i,
                }
                caseActivityList.push(item)
            }
        }
    }
    return caseActivityList
}


let caseMap = getCaseMap(defaultData);
// console.log(caseMap)
// let variantMap = getVariantMap(caseMap);
// console.log(getVariantMap(caseMap));
// console.log(getVariantCaseList(flowCode, variantMap));
// console.log(getCaseActivityList(flowCode, variantMap));
// console.log(getFlowVariantList(flowCode, variantMap));
// console.log(getFlowActivityList(flowCode, variantMap));
// console.log(caseMap)
// console.log("\n\n")
// console.log(variantMap)
// node.error(["变体活动表", getCaseActivityList(flowCodeVariant_map)])
// node.error(["变体案例表", getVariantCaseList(flowCodeVariant_map)])
// node.error(["流程变体表", getFlowVariantList(flowCodeVariant_map)])
// node.error(["流程活动表", getFlowActivityList(flowCase_map)])

