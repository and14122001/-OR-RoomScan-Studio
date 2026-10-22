# Integration map

| Capability | Upstream/source | Integration method | Current status |
|---|---|---|---|
| GPU room reconstruction | [QuestRoomScan](https://github.com/genesisinteractive/QuestRoomScan) | Import and write an adapter against the pinned API | Not integrated |
| Room planes/labels | Meta MRUK / Scene API | Load room anchors and semantic labels | Not integrated |
| Dynamic occlusion | Meta Depth API / [Project Phanto](https://developers.meta.com/vr/documentation/unity/unity-sample-phanto/) | Import official sample and validate Environment Depth | Not integrated |
| Room virtualization | Unity app layer | Toggle passthrough, scan mesh and virtual shell | Scaffold planned |
| CAD import | DXF parser | Preserve units and layer names | Not implemented |
| CAD registration | App layer | Control points, transform solve and residual report | Not implemented |
| Deviation heatmap | App layer | Compare aligned scan mesh with CAD surfaces | Not implemented |
| Exports | App/libraries | PLY/OBJ/GLB, DXF/PDF; validate DWG conversion separately | Not implemented |

Keep the reconstruction mesh as engineering geometry. Optional Gaussian Splatting may improve visual presentation but must not replace the mesh used for measurement. Dynamic occlusion is neither collision safety nor metrology.
