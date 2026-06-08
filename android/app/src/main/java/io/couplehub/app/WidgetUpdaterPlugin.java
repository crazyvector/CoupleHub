package io.couplehub.app;

import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetUpdater")
public class WidgetUpdaterPlugin extends Plugin {
    
    @PluginMethod
    public void update(PluginCall call) {
        Context context = getContext();
        AppWidgetManager appWidgetManager = AppWidgetManager.getInstance(context);
        
        // Trigger Todo Widget Update
        int[] todoIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, TodoWidget.class));
        if (todoIds != null && todoIds.length > 0) {
            Intent intent = new Intent(context, TodoWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, todoIds);
            context.sendBroadcast(intent);
        }

        // Trigger Calendar Widget Update
        int[] calendarIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, CalendarWidget.class));
        if (calendarIds != null && calendarIds.length > 0) {
            Intent intent = new Intent(context, CalendarWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, calendarIds);
            context.sendBroadcast(intent);
        }

        // Trigger Pomodoro Widget Update
        int[] pomodoroIds = appWidgetManager.getAppWidgetIds(new ComponentName(context, PomodoroWidget.class));
        if (pomodoroIds != null && pomodoroIds.length > 0) {
            Intent intent = new Intent(context, PomodoroWidget.class);
            intent.setAction(AppWidgetManager.ACTION_APPWIDGET_UPDATE);
            intent.putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, pomodoroIds);
            context.sendBroadcast(intent);
        }

        call.resolve();
    }
}
